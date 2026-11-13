
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  NewOrderInput,
  Order,
  OrderInfoInput,
  OrderStatus,
} from "../types/order";

import {
  calcSubtotal,
  calcTotal,
  getAllowedTransitions,
  getOrderHistory,
  installmentRemaining,
  nextOrderCode,
  normalizePhone,
  PHONE_PATTERN,
} from "../utils/orders";

import {
  assignMissingCustomerCodes,
  canonicalPhone,
  findCustomerCode,
  nextCustomerCode,
  resolveCustomerCode,
} from "../utils/customers";

import { formatPrice } from "../utils/format";
import { saveToStorage } from "../utils/storage";
import { findColor, hasOwnStock } from "../utils/stock";
import { useProducts } from "./ProductContext";

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; error: string };

interface OrderContextType {
  orders: Order[];

  getOrderById: (id: string) => Order | undefined;

  createOrder: (
    input: NewOrderInput,
  ) => Promise<Result<{ order: Order }>>;

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    options?: { reason?: string },
  ) => Promise<Result>;

  updateOrderInfo: (
    id: string,
    info: OrderInfoInput,
  ) => Result;

  addInstallmentPayment: (
    id: string,
    input: { amount: number; note?: string },
  ) => Result;

  removeInstallmentPayment: (
    id: string,
    paymentId: string,
  ) => Result;
}

const OrderContext = createContext<
  OrderContextType | undefined
>(undefined);

const STORAGE_KEY = "product-management-orders";

function loadOrders(): Order[] {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { products, adjustStock } = useProducts();

  const [orders, setOrders] = useState<Order[]>(() =>
    assignMissingCustomerCodes(loadOrders()),
  );

  // Luôn giữ bản đơn hàng mới nhất.
  const ordersRef = useRef(orders);

  // Chống thao tác đồng thời trên cùng một đơn hàng.
  const processingOrdersRef = useRef(new Set<string>());

  useEffect(() => {
    ordersRef.current = orders;
    saveToStorage(STORAGE_KEY, orders);
  }, [orders]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);

        if (Array.isArray(parsed)) {
          ordersRef.current = parsed;
          setOrders(parsed);
        }
      } catch {
        // Bỏ qua dữ liệu hỏng.
      }
    };

    window.addEventListener("storage", handleStorage);

    return () =>
      window.removeEventListener("storage", handleStorage);
  }, []);

  const getOrderById = (id: string) =>
    ordersRef.current.find((order) => order.id === id);

  // =====================================================
  // TẠO ĐƠN HÀNG
  // =====================================================

  const createOrder = async (
    input: NewOrderInput,
  ): Promise<Result<{ order: Order }>> => {
    if (input.items.length === 0) {
      return {
        ok: false,
        error: "Đơn hàng chưa có sản phẩm nào.",
      };
    }

    // Gộp số lượng theo sản phẩm và màu sắc.
    const lines = new Map<
      string,
      {
        productId: string;
        colorId?: string;
        quantity: number;
      }
    >();

    for (const item of input.items) {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return {
          ok: false,
          error: `Số lượng của "${item.productName}" không hợp lệ.`,
        };
      }

      const key = `${item.productId}:${item.colorId ?? ""}`;

      lines.set(key, {
        productId: item.productId,
        colorId: item.colorId,
        quantity:
          (lines.get(key)?.quantity ?? 0) + item.quantity,
      });
    }

    // Kiểm tra tồn kho trước khi tạo đơn.
    const sharedNeeded = new Map<string, number>();

    for (const line of lines.values()) {
      const product = products.find(
        (candidate) => candidate.id === line.productId,
      );

      if (!product) {
        return {
          ok: false,
          error:
            "Có sản phẩm trong giỏ không còn tồn tại. Hãy xóa khỏi giỏ và thử lại.",
        };
      }

      const color = findColor(product, line.colorId);

      if (hasOwnStock(color)) {
        if (color.quantity < line.quantity) {
          return {
            ok: false,
            error: `"${product.name}" màu ${color.name} chỉ còn ${color.quantity} trong kho, không đủ ${line.quantity}.`,
          };
        }
      } else {
        sharedNeeded.set(
          product.id,
          (sharedNeeded.get(product.id) ?? 0) +
            line.quantity,
        );
      }
    }

    for (const [productId, quantity] of sharedNeeded) {
      const product = products.find(
        (candidate) => candidate.id === productId,
      );

      if (product && product.quantity < quantity) {
        return {
          ok: false,
          error: `"${product.name}" chỉ còn ${product.quantity} trong kho, không đủ ${quantity}.`,
        };
      }
    }

    // Kiểm tra giảm giá.
    const subtotal = calcSubtotal(input.items);

    if (
      input.discount < 0 ||
      input.discount > subtotal
    ) {
      return {
        ok: false,
        error: "Giảm giá phải từ 0 đến tổng tiền hàng.",
      };
    }

    const total = calcTotal(subtotal, input.discount);
    const now = new Date().toISOString();

    // Kiểm tra trả góp.
    let installment: Order["installment"];

    if (input.paymentMethod === "installment") {
      const plan = input.installment;

      if (!plan) {
        return {
          ok: false,
          error: "Vui lòng nhập thông tin trả góp.",
        };
      }

      if (
        !Number.isInteger(plan.months) ||
        plan.months < 1 ||
        plan.months > 36
      ) {
        return {
          ok: false,
          error: "Số tháng trả góp phải từ 1 đến 36.",
        };
      }

      if (
        !Number.isInteger(plan.downPayment) ||
        plan.downPayment < 0 ||
        plan.downPayment >= total
      ) {
        return {
          ok: false,
          error:
            "Tiền trả trước phải từ 0 và nhỏ hơn tổng thanh toán của đơn.",
        };
      }

      if (input.status === "completed") {
        return {
          ok: false,
          error:
            "Đơn trả góp chỉ hoàn thành khi khách đã trả đủ.",
        };
      }

      installment = {
        months: plan.months,
        downPayment: plan.downPayment,
        payments:
          plan.downPayment > 0
            ? [
                {
                  id: crypto.randomUUID(),
                  amount: plan.downPayment,
                  paidAt: now,
                  note: "Trả trước",
                },
              ]
            : [],
      };
    } else if (input.status === "installment") {
      return {
        ok: false,
        error:
          'Trạng thái "Đang trả góp" chỉ dùng cho đơn trả góp.',
      };
    }

    const currentOrders = ordersRef.current;

    const order: Order = {
      id: crypto.randomUUID(),
      code: nextOrderCode(currentOrders),
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerCode: resolveCustomerCode(
        currentOrders,
        input.customerPhone,
      ),
      note: input.note.trim(),
      paymentMethod: input.paymentMethod,
      status: input.status,
      items: input.items,
      subtotal,
      discount: input.discount,
      total,
      createdAt: now,
      completedAt:
        input.status === "completed" ? now : undefined,
      history: [
        {
          status: input.status,
          at: now,
        },
      ],
      installment,
    };

    const stockChanges = Array.from(
      lines.values(),
      (line) => ({
        productId: line.productId,
        colorId: line.colorId,
        delta: -line.quantity,
      }),
    );

    try {
      // Trừ kho trong MySQL trước.
      // Chỉ tạo đơn nếu thao tác trừ kho thành công.
      await adjustStock(
        stockChanges,
        `order:${order.id}:deduct`,
        "deduct",
      );

      ordersRef.current = [
        order,
        ...ordersRef.current,
      ];

      setOrders((current) => [
        order,
        ...current,
      ]);

      return {
        ok: true,
        order,
      };
    } catch (error) {
      console.error("Lỗi trừ tồn kho:", error);

      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật tồn kho. Đơn hàng chưa được tạo.",
      };
    }
  };

  // =====================================================
  // CẬP NHẬT ĐƠN HÀNG
  // =====================================================

  const commitOrder = (updated: Order) => {
    const nextOrders = ordersRef.current.map((item) =>
      item.id === updated.id ? updated : item,
    );

    ordersRef.current = nextOrders;
    setOrders(nextOrders);
  };

  // =====================================================
  // ĐỔI TRẠNG THÁI / HỦY ĐƠN
  // =====================================================

  const updateOrderStatus = async (
    id: string,
    status: OrderStatus,
    options?: { reason?: string },
  ): Promise<Result> => {
    if (processingOrdersRef.current.has(id)) {
      return {
        ok: false,
        error: "Đơn hàng đang được xử lý. Vui lòng chờ.",
      };
    }

    const order = ordersRef.current.find(
      (item) => item.id === id,
    );

    if (!order) {
      return {
        ok: false,
        error: "Không tìm thấy đơn hàng.",
      };
    }

    if (!getAllowedTransitions(order).includes(status)) {
      return {
        ok: false,
        error: "Không thể chuyển đơn sang trạng thái này.",
      };
    }

    // Đơn trả góp chỉ hoàn thành khi khách đã trả đủ.
    if (
      status === "completed" &&
      order.paymentMethod === "installment" &&
      installmentRemaining(order) > 0
    ) {
      return {
        ok: false,
        error: `Khách còn phải trả ${formatPrice(
          installmentRemaining(order),
        )}. Hãy ghi nhận đủ các khoản thu trước khi hoàn thành đơn.`,
      };
    }

    const reason = options?.reason?.trim() ?? "";

    if (status === "cancelled") {
      if (!reason) {
        return {
          ok: false,
          error: "Vui lòng chọn hoặc nhập lý do hủy đơn.",
        };
      }

      if (reason.length > 300) {
        return {
          ok: false,
          error: "Lý do hủy tối đa 300 ký tự.",
        };
      }
    }

    const now = new Date().toISOString();

    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: now,
      completedAt:
        status === "completed"
          ? now
          : order.completedAt,
      cancelledAt:
        status === "cancelled"
          ? now
          : order.cancelledAt,
      cancelReason:
        status === "cancelled"
          ? reason
          : order.cancelReason,
      history: [
        ...getOrderHistory(order),
        {
          status,
          at: now,
          note:
            status === "cancelled"
              ? reason
              : undefined,
        },
      ],
    };

    if (status === "cancelled") {
      try {
        processingOrdersRef.current.add(id);

        // Hoàn kho trong MySQL trước khi đổi trạng thái đơn.
        await adjustStock(
          order.items.map((item) => ({
            productId: item.productId,
            colorId: item.colorId,
            delta: item.quantity,
          })),
          `order:${order.id}:restore`,
          "restore",
        );

        commitOrder(updatedOrder);

        return { ok: true };
      } catch (error) {
        console.error("Lỗi hoàn tồn kho:", error);

        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Không thể hoàn tồn kho. Đơn hàng chưa được hủy.",
        };
      } finally {
        processingOrdersRef.current.delete(id);
      }
    }

    commitOrder(updatedOrder);

    return { ok: true };
  };

  // =====================================================
  // SỬA THÔNG TIN KHÁCH HÀNG / THANH TOÁN
  // =====================================================

  const updateOrderInfo = (
    id: string,
    info: OrderInfoInput,
  ): Result => {
    const order = ordersRef.current.find(
      (item) => item.id === id,
    );

    if (!order) {
      return {
        ok: false,
        error: "Không tìm thấy đơn hàng.",
      };
    }

    if (order.status === "cancelled") {
      return {
        ok: false,
        error: "Đơn đã hủy không thể chỉnh sửa.",
      };
    }

    const customerName = info.customerName.trim();
    const customerPhone = normalizePhone(
      info.customerPhone,
    );
    const note = info.note.trim();

    if (customerName.length > 100) {
      return {
        ok: false,
        error: "Tên khách hàng tối đa 100 ký tự.",
      };
    }

    if (
      customerPhone &&
      !PHONE_PATTERN.test(customerPhone)
    ) {
      return {
        ok: false,
        error:
          "Số điện thoại không hợp lệ (ví dụ: 0901234567).",
      };
    }

    if (note.length > 500) {
      return {
        ok: false,
        error: "Ghi chú tối đa 500 ký tự.",
      };
    }

    if (
      info.paymentMethod !== order.paymentMethod &&
      (order.paymentMethod === "installment" ||
        info.paymentMethod === "installment")
    ) {
      return {
        ok: false,
        error:
          "Không thể đổi phương thức thanh toán sang hoặc khỏi Trả góp. Hãy hủy đơn và tạo đơn mới.",
      };
    }

    const others = ordersRef.current.filter(
      (item) => item.id !== order.id,
    );

    let customerCode: string | undefined;

    if (canonicalPhone(customerPhone)) {
      customerCode =
        findCustomerCode(others, customerPhone) ??
        (order.customerCode &&
        !others.some(
          (item) =>
            item.customerCode === order.customerCode,
        )
          ? order.customerCode
          : undefined) ??
        nextCustomerCode(ordersRef.current);
    }

    commitOrder({
      ...order,
      customerName,
      customerPhone,
      customerCode,
      note,
      paymentMethod: info.paymentMethod,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true };
  };

  // =====================================================
  // GHI NHẬN KHOẢN THANH TOÁN TRẢ GÓP
  // =====================================================

  const addInstallmentPayment = (
    id: string,
    input: {
      amount: number;
      note?: string;
    },
  ): Result => {
    const order = ordersRef.current.find(
      (item) => item.id === id,
    );

    if (!order || !order.installment) {
      return {
        ok: false,
        error: "Đây không phải đơn trả góp.",
      };
    }

    if (
      order.status === "completed" ||
      order.status === "cancelled"
    ) {
      return {
        ok: false,
        error:
          "Đơn đã hoàn thành hoặc đã hủy, không ghi nhận thêm được.",
      };
    }

    if (
      !Number.isInteger(input.amount) ||
      input.amount <= 0
    ) {
      return {
        ok: false,
        error: "Số tiền phải lớn hơn 0.",
      };
    }

    const remaining = installmentRemaining(order);

    if (input.amount > remaining) {
      return {
        ok: false,
        error: `Số tiền vượt quá phần còn phải thu (${formatPrice(
          remaining,
        )}).`,
      };
    }

    const note = input.note?.trim() ?? "";

    if (note.length > 200) {
      return {
        ok: false,
        error: "Ghi chú tối đa 200 ký tự.",
      };
    }

    const now = new Date().toISOString();

    commitOrder({
      ...order,
      updatedAt: now,
      installment: {
        ...order.installment,
        payments: [
          ...order.installment.payments,
          {
            id: crypto.randomUUID(),
            amount: input.amount,
            paidAt: now,
            note: note || undefined,
          },
        ],
      },
    });

    return { ok: true };
  };

  // =====================================================
  // XÓA KHOẢN THU TRẢ GÓP
  // =====================================================

  const removeInstallmentPayment = (
    id: string,
    paymentId: string,
  ): Result => {
    const order = ordersRef.current.find(
      (item) => item.id === id,
    );

    if (!order || !order.installment) {
      return {
        ok: false,
        error: "Đây không phải đơn trả góp.",
      };
    }

    if (
      order.status === "completed" ||
      order.status === "cancelled"
    ) {
      return {
        ok: false,
        error:
          "Đơn đã hoàn thành hoặc đã hủy, không sửa được khoản thu.",
      };
    }

    const paymentExists =
      order.installment.payments.some(
        (payment) => payment.id === paymentId,
      );

    if (!paymentExists) {
      return {
        ok: false,
        error: "Không tìm thấy khoản thu cần xóa.",
      };
    }

    commitOrder({
      ...order,
      updatedAt: new Date().toISOString(),
      installment: {
        ...order.installment,
        payments:
          order.installment.payments.filter(
            (payment) => payment.id !== paymentId,
          ),
      },
    });

    return { ok: true };
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        getOrderById,
        createOrder,
        updateOrderStatus,
        updateOrderInfo,
        addInstallmentPayment,
        removeInstallmentPayment,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders phải được sử dụng bên trong OrderProvider",
    );
  }

  return context;
}
