import type {
  Order,
  OrderHistoryEntry,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from "../types/order";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  cod: "Thu hộ (COD)",
};

// Trạng thái nào được chuyển sang trạng thái nào.
// "Đã hủy" là trạng thái cuối: kho đã được hoàn lại nên không cho mở lại.
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["shipping", "completed", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

// Các bước của một đơn xử lý bình thường (đơn bị hủy nằm ngoài luồng này)
export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "shipping",
  "completed",
];

// Bước tiếp theo khi bấm thao tác nhanh ở danh sách đơn
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "shipping",
  shipping: "completed",
};

export const STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  shipping: "🚚 Giao hàng",
  completed: "✓ Hoàn thành đơn",
};

export const OTHER_CANCEL_REASON = "Khác";

export const CANCEL_REASONS = [
  "Khách đổi ý, không muốn mua nữa",
  "Khách không nghe máy / không nhận hàng",
  "Hết hàng hoặc sản phẩm bị lỗi",
  "Nhập nhầm hoặc trùng đơn",
  OTHER_CANCEL_REASON,
];

export const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s.]/g, "");
}

// Đơn cũ chưa có `history` thì dựng lại từ các mốc thời gian đã lưu
export function getOrderHistory(order: Order): OrderHistoryEntry[] {
  if (order.history && order.history.length > 0) {
    return order.history;
  }

  const entries: OrderHistoryEntry[] = [
    {
      status:
        order.completedAt === order.createdAt ? "completed" : "pending",
      at: order.createdAt,
    },
  ];

  if (order.completedAt && order.completedAt !== order.createdAt) {
    entries.push({ status: "completed", at: order.completedAt });
  }

  if (order.cancelledAt) {
    entries.push({
      status: "cancelled",
      at: order.cancelledAt,
      note: order.cancelReason,
    });
  }

  return entries;
}

export function calcSubtotal(items: OrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
}

export function calcTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - Math.max(0, discount));
}

export function nextOrderCode(orders: Order[]): string {
  const max = orders.reduce((current, order) => {
    const number = Number(order.code.replace(/\D/g, ""));
    return Number.isFinite(number) && number > current
      ? number
      : current;
  }, 0);

  return `DH${String(max + 1).padStart(4, "0")}`;
}

// Chỉ đơn "Hoàn thành" mới được tính là doanh thu
export function completedOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.status === "completed");
}

export function totalRevenue(orders: Order[]): number {
  return completedOrders(orders).reduce(
    (sum, order) => sum + order.total,
    0,
  );
}

// Khóa ngày theo giờ địa phương (YYYY-MM-DD), tránh lệch ngày do UTC
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function revenueDate(order: Order): Date {
  return new Date(order.completedAt ?? order.createdAt);
}

export interface DayRevenue {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

export function lastDaysRevenue(
  orders: Order[],
  days: number,
  now: Date = new Date(),
): DayRevenue[] {
  const buckets: DayRevenue[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset,
    );

    buckets.push({
      key: dayKey(date),
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      revenue: 0,
      orders: 0,
    });
  }

  completedOrders(orders).forEach((order) => {
    const bucket = buckets.find(
      (item) => item.key === dayKey(revenueDate(order)),
    );

    if (bucket) {
      bucket.revenue += order.total;
      bucket.orders += 1;
    }
  });

  return buckets;
}

export interface SalesStat {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export function salesByProduct(
  orders: Order[],
): Map<string, SalesStat> {
  const map = new Map<string, SalesStat>();

  completedOrders(orders).forEach((order) => {
    order.items.forEach((item) => {
      const current = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += item.quantity;
      current.revenue += item.unitPrice * item.quantity;
      current.name = item.productName;

      map.set(item.productId, current);
    });
  });

  return map;
}

export function topProducts(
  orders: Order[],
  limit = 5,
): SalesStat[] {
  return Array.from(salesByProduct(orders).values())
    .sort(
      (a, b) =>
        b.quantity - a.quantity || b.revenue - a.revenue,
    )
    .slice(0, limit);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);

  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
    "vi-VN",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

function csvCell(value: string | number): string {
  const text = String(value);

  return /[",\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

// Có BOM để Excel đọc đúng tiếng Việt
export function ordersToCsv(orders: Order[]): string {
  const header = [
    "Mã đơn",
    "Ngày tạo",
    "Khách hàng",
    "Số điện thoại",
    "Sản phẩm",
    "Tạm tính",
    "Giảm giá",
    "Tổng tiền",
    "Thanh toán",
    "Trạng thái",
    "Lý do hủy",
  ];

  const rows = orders.map((order) => [
    order.code,
    formatDateTime(order.createdAt),
    order.customerName || "Khách lẻ",
    order.customerPhone,
    order.items
      .map(
        (item) =>
          `${item.productName}${
            item.colorName ? ` (${item.colorName})` : ""
          } x${item.quantity}`,
      )
      .join("; "),
    order.subtotal,
    order.discount,
    order.total,
    PAYMENT_LABEL[order.paymentMethod],
    STATUS_LABEL[order.status],
    order.cancelReason ?? "",
  ]);

  return (
    "\uFEFF" +
    [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}