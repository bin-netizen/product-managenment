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
  getOrderHistory,
  nextOrderCode,
  normalizePhone,
  PHONE_PATTERN,
  STATUS_TRANSITIONS,
} from "../utils/orders";
import { saveToStorage } from "../utils/storage";
import { findColor, hasOwnStock } from "../utils/stock";
import { useProducts } from "./ProductContext";

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; error: string };

interface OrderContextType {
  orders: Order[];

  getOrderById: (id: string) => Order | undefined;

  createOrder: (input: NewOrderInput) => Result<{ order: Order }>;

  // Hủy đơn bắt buộc có lý do (options.reason)
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    options?: { reason?: string },
  ) => Result;

  // Sửa thông tin khách / thanh toán / ghi chú (không sửa sản phẩm trong đơn)
  updateOrderInfo: (id: string, info: OrderInfoInput) => Result;
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

  const [orders, setOrders] = useState<Order[]>(loadOrders);

  // Bản đơn hàng mới nhất, cập nhật ngay trong handler để bấm hai lần liên tiếp
  // (ví dụ double-click "Hủy đơn") không hoàn kho hai lần.
  const ordersRef = useRef(orders);

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
          setOrders(parsed);
        }
      } catch {
        // bỏ qua dữ liệu hỏng
      }
    };

    window.addEventListener("storage", handleStorage);

    return () =>
      window.removeEventListener("storage", handleStorage);
  }, []);

  const getOrderById = (id: string) =>
    orders.find((order) => order.id === id);

  const createOrder = (
    input: NewOrderInput,
  ): Result<{ order: Order }> => {
    if (input.items.length === 0) {
      return { ok: false, error: "Đơn hàng chưa có sản phẩm nào." };
    }

    // Gộp số lượng theo (sản phẩm, màu)
    const lines = new Map<
      string,
      { productId: string; colorId?: string; quantity: number }
    >();

    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return {
          ok: false,
          error: `Số lượng của "${item.productName}" không hợp lệ.`,
        };
      }

      const key = `${item.productId}:${item.colorId ?? ""}`;

      lines.set(key, {
        productId: item.productId,
        colorId: item.colorId,
        quantity: (lines.get(key)?.quantity ?? 0) + item.quantity,
      });
    }

    // Màu có kho riêng thì kiểm tra riêng từng màu.
    // Màu của sản phẩm cũ (chưa có kho riêng) vẫn dùng chung kho của sản phẩm.
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
          (sharedNeeded.get(product.id) ?? 0) + line.quantity,
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

    const subtotal = calcSubtotal(input.items);

    if (input.discount < 0 || input.discount > subtotal) {
      return {
        ok: false,
        error: "Giảm giá phải từ 0 đến tổng tiền hàng.",
      };
    }

    const now = new Date().toISOString();

    const order: Order = {
      id: crypto.randomUUID(),
      code: nextOrderCode(orders),
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      note: input.note.trim(),
      paymentMethod: input.paymentMethod,
      status: input.status,
      items: input.items,
      subtotal,
      discount: input.discount,
      total: calcTotal(subtotal, input.discount),
      createdAt: now,
      completedAt:
        input.status === "completed" ? now : undefined,
      history: [{ status: input.status, at: now }],
    };

    // Trừ kho ngay khi tạo đơn (giữ hàng), kể cả đơn đang chờ xử lý
    adjustStock(
      Array.from(lines.values(), (line) => ({
        productId: line.productId,
        colorId: line.colorId,
        delta: -line.quantity,
      })),
    );

    setOrders((current) => [order, ...current]);

    return { ok: true, order };
  };

  const commitOrder = (updated: Order) => {
    ordersRef.current = ordersRef.current.map((item) =>
      item.id === updated.id ? updated : item,
    );

    setOrders((current) =>
      current.map((item) =>
        item.id === updated.id ? updated : item,
      ),
    );
  };

  const updateOrderStatus = (
    id: string,
    status: OrderStatus,
    options?: { reason?: string },
  ): Result => {
    const order = ordersRef.current.find((item) => item.id === id);

    if (!order) {
      return { ok: false, error: "Không tìm thấy đơn hàng." };
    }

    if (!STATUS_TRANSITIONS[order.status].includes(status)) {
      return {
        ok: false,
        error: "Không thể chuyển đơn sang trạng thái này.",
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

    commitOrder({
      ...order,
      status,
      updatedAt: now,
      completedAt:
        status === "completed" ? now : order.completedAt,
      cancelledAt:
        status === "cancelled" ? now : order.cancelledAt,
      cancelReason:
        status === "cancelled" ? reason : order.cancelReason,
      history: [
        ...getOrderHistory(order),
        {
          status,
          at: now,
          note: status === "cancelled" ? reason : undefined,
        },
      ],
    });

    // Hủy đơn thì hoàn hàng về kho (bỏ qua sản phẩm đã bị xóa)
    if (status === "cancelled") {
      adjustStock(
        order.items.map((item) => ({
          productId: item.productId,
          colorId: item.colorId,
          delta: item.quantity,
        })),
      );
    }

    return { ok: true };
  };

  const updateOrderInfo = (
    id: string,
    info: OrderInfoInput,
  ): Result => {
    const order = ordersRef.current.find((item) => item.id === id);

    if (!order) {
      return { ok: false, error: "Không tìm thấy đơn hàng." };
    }

    if (order.status === "cancelled") {
      return {
        ok: false,
        error: "Đơn đã hủy không thể chỉnh sửa.",
      };
    }

    const customerName = info.customerName.trim();
    const customerPhone = normalizePhone(info.customerPhone);
    const note = info.note.trim();

    if (customerName.length > 100) {
      return { ok: false, error: "Tên khách hàng tối đa 100 ký tự." };
    }

    if (customerPhone && !PHONE_PATTERN.test(customerPhone)) {
      return {
        ok: false,
        error: "Số điện thoại không hợp lệ (ví dụ: 0901234567).",
      };
    }

    if (note.length > 500) {
      return { ok: false, error: "Ghi chú tối đa 500 ký tự." };
    }

    commitOrder({
      ...order,
      customerName,
      customerPhone,
      note,
      paymentMethod: info.paymentMethod,
      updatedAt: new Date().toISOString(),
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