import type { Order } from "../types/order";
import { installmentOutstanding } from "./orders";

export interface CustomerSummary {
  // Số điện thoại đã chuẩn hóa, dùng làm mã khách (cũng là phần cuối của đường dẫn /customers/:phone)
  key: string;
  // Mã khách hàng, ví dụ KH0001 (rỗng nếu dữ liệu quá cũ chưa được cấp mã)
  code: string;
  name: string;
  phone: string;
  // Tất cả đơn của khách, mới nhất trước
  orders: Order[];
  // Số đơn không tính đơn đã hủy
  orderCount: number;
  completedCount: number;
  cancelledCount: number;
  // Tổng tiền các đơn đã hoàn thành (khớp cách tính doanh thu)
  totalSpent: number;
  // Tiền khách còn nợ từ các đơn trả góp đang xử lý
  outstanding: number;
  firstOrderAt: string;
  lastOrderAt: string;
}

// "+84 901 234 567" và "0901234567" là cùng một số
export function canonicalPhone(value: string): string {
  const digits = value.replace(/[\s.\-()]/g, "");

  return digits.startsWith("+84") ? `0${digits.slice(3)}` : digits;
}

const CODE_PREFIX = "KH";

function codeNumber(code?: string): number {
  const match = /^KH(\d+)$/.exec(code ?? "");

  return match ? Number(match[1]) : 0;
}

function formatCode(value: number): string {
  return `${CODE_PREFIX}${String(value).padStart(4, "0")}`;
}

// Mã tiếp theo = mã lớn nhất đang có + 1
export function nextCustomerCode(orders: Order[]): string {
  return formatCode(
    orders.reduce(
      (max, order) => Math.max(max, codeNumber(order.customerCode)),
      0,
    ) + 1,
  );
}

// Số điện thoại này đã có mã chưa (từ các đơn trước)
export function findCustomerCode(
  orders: Order[],
  phone: string,
): string | undefined {
  const key = canonicalPhone(phone);

  if (!key) return undefined;

  return orders.find(
    (order) =>
      order.customerCode &&
      canonicalPhone(order.customerPhone ?? "") === key,
  )?.customerCode;
}

// Mã cho đơn mới: dùng lại mã của khách cũ, chưa có thì cấp mã mới. Không có SĐT thì không có mã.
export function resolveCustomerCode(
  orders: Order[],
  phone: string,
): string | undefined {
  if (!canonicalPhone(phone)) return undefined;

  return findCustomerCode(orders, phone) ?? nextCustomerCode(orders);
}

// Cấp mã cho các đơn cũ chưa có, theo thứ tự khách xuất hiện sớm nhất. Đã có đủ mã thì giữ nguyên mảng.
export function assignMissingCustomerCodes(orders: Order[]): Order[] {
  const needs = (order: Order) =>
    !order.customerCode && canonicalPhone(order.customerPhone ?? "") !== "";

  if (!orders.some(needs)) return orders;

  const byPhone = new Map<string, string>();
  let max = 0;

  for (const order of orders) {
    if (!order.customerCode) continue;

    max = Math.max(max, codeNumber(order.customerCode));

    const key = canonicalPhone(order.customerPhone ?? "");

    if (key && !byPhone.has(key)) byPhone.set(key, order.customerCode);
  }

  const assigned = new Map<string, string>();

  for (const order of [...orders].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )) {
    if (!needs(order)) continue;

    const key = canonicalPhone(order.customerPhone ?? "");
    let code = byPhone.get(key);

    if (!code) {
      max += 1;
      code = formatCode(max);
      byPhone.set(key, code);
    }

    assigned.set(order.id, code);
  }

  return orders.map((order) =>
    assigned.has(order.id)
      ? { ...order, customerCode: assigned.get(order.id) }
      : order,
  );
}

// Bỏ dấu tiếng Việt và chữ hoa để tìm "nguyen" ra "Nguyễn"
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// Gom đơn theo số điện thoại. Đơn không có số điện thoại (khách lẻ) không gom được nên chỉ đếm.
export function buildCustomers(orders: Order[]): {
  customers: CustomerSummary[];
  withoutPhone: number;
} {
  const groups = new Map<string, Order[]>();
  let withoutPhone = 0;

  for (const order of orders) {
    const key = canonicalPhone(order.customerPhone ?? "");

    if (!key) {
      withoutPhone += 1;
      continue;
    }

    const list = groups.get(key);

    if (list) {
      list.push(order);
    } else {
      groups.set(key, [order]);
    }
  }

  const customers = [...groups.entries()].map(([key, list]) => {
    const sorted = [...list].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    const active = sorted.filter((order) => order.status !== "cancelled");
    const completed = sorted.filter((order) => order.status === "completed");

    return {
      key,
      // Nếu các đơn có mã khác nhau (do sửa số điện thoại) thì lấy mã của đơn cũ nhất
      code:
        [...sorted].reverse().find((order) => order.customerCode)
          ?.customerCode ?? "",
      // Lấy tên ở đơn mới nhất có ghi tên (khách có thể đổi cách ghi tên)
      name:
        sorted.find((order) => order.customerName.trim())?.customerName.trim() ??
        "Khách chưa đặt tên",
      phone: key,
      orders: sorted,
      orderCount: active.length,
      completedCount: completed.length,
      cancelledCount: sorted.length - active.length,
      totalSpent: completed.reduce((sum, order) => sum + order.total, 0),
      outstanding: sorted.reduce(
        (sum, order) => sum + installmentOutstanding(order),
        0,
      ),
      firstOrderAt: sorted[sorted.length - 1].createdAt,
      lastOrderAt: sorted[0].createdAt,
    };
  });

  return { customers, withoutPhone };
}

// Tìm khách theo mã (KH0001) hoặc theo số điện thoại
export function getCustomerByKey(
  orders: Order[],
  idOrPhone: string,
): CustomerSummary | undefined {
  const { customers } = buildCustomers(orders);
  const code = idOrPhone.trim().toUpperCase();
  const key = canonicalPhone(idOrPhone);

  return (
    customers.find((customer) => customer.code === code) ??
    customers.find((customer) => customer.key === key)
  );
}