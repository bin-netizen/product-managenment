import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  NewOrderInput,
  Order,
  OrderStatus,
} from "../types/order";
import {
  calcSubtotal,
  calcTotal,
  nextOrderCode,
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

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
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

  const [orders, setOrders] = useState<Order[]>(loadOrders);
  useEffect(() => {
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

  const updateOrderStatus = (
    id: string,
    status: OrderStatus,
  ): Result => {
    const order = orders.find((item) => item.id === id);

    if (!order) {
      return { ok: false, error: "Không tìm thấy đơn hàng." };
    }

    if (!STATUS_TRANSITIONS[order.status].includes(status)) {
      return {
        ok: false,
        error: "Không thể chuyển đơn sang trạng thái này.",
      };
    }

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

    const now = new Date().toISOString();

    setOrders((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              completedAt:
                status === "completed"
                  ? now
                  : item.completedAt,
              cancelledAt:
                status === "cancelled"
                  ? now
                  : item.cancelledAt,
            }
          : item,
      ),
    );

    return { ok: true };
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        getOrderById,
        createOrder,
        updateOrderStatus,
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