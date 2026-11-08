export type OrderStatus =
  | "pending"
  | "shipping"
  | "installment"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "transfer" | "cod" | "installment";

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

// Một lần khách trả tiền (gồm cả khoản trả trước nếu có)
export interface InstallmentPayment {
  id: string;
  amount: number;
  paidAt: string;
  note?: string;
}

// Kế hoạch trả góp của đơn. Không tính lãi: tổng khách phải trả = tổng đơn.
export interface InstallmentPlan {
  months: number;
  downPayment: number;
  payments: InstallmentPayment[];
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
  // Chỉ có khi paymentMethod === "installment"
  installment?: InstallmentPlan;

  // Mã khách hàng (KH0001...), cấp theo số điện thoại. Đơn khách lẻ không có mã.
  customerCode?: string;
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
  // Bắt buộc khi paymentMethod === "installment"
  installment?: { months: number; downPayment: number };
}

// Thông tin được phép sửa sau khi tạo đơn (không gồm sản phẩm, vì sửa sản phẩm sẽ ảnh hưởng kho)
export interface OrderInfoInput {
  customerName: string;
  customerPhone: string;
  note: string;
  paymentMethod: PaymentMethod;
}