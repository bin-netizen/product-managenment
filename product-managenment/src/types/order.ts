export type OrderStatus = "pending" | "completed" | "cancelled";

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