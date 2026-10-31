export type OrderStatus =
  | "pending"
  | "shipping"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "transfer" | "cod";

export interface OrderItem {
  productId: string;
  // Lưu "ảnh chụp" tên/giá tại thời điểm bán để đơn cũ không đổi khi sản phẩm bị sửa hoặc xóa
  productName: string;
  colorId?: string;
  colorName?: string;
  unitPrice: number;
  quantity: number;
}

// Một mốc trong lịch sử xử lý đơn (mốc đầu tiên là lúc tạo đơn)
export interface OrderHistoryEntry {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  code: string;

  customerName: string;
  customerPhone: string;
  note: string;

  paymentMethod: PaymentMethod;
  status: OrderStatus;

  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;

  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;

  // Các trường dưới đây đều optional để đơn cũ trong localStorage vẫn hợp lệ.
  cancelReason?: string;
  history?: OrderHistoryEntry[];
  updatedAt?: string;
}

export interface NewOrderInput {
  customerName: string;
  customerPhone: string;
  note: string;
  paymentMethod: PaymentMethod;
  status: Exclude<OrderStatus, "cancelled">;
  discount: number;
  items: OrderItem[];
}

// Thông tin được phép sửa sau khi tạo đơn (không gồm sản phẩm, vì sửa sản phẩm sẽ ảnh hưởng kho)
export interface OrderInfoInput {
  customerName: string;
  customerPhone: string;
  note: string;
  paymentMethod: PaymentMethod;
}