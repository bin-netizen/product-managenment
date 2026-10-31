export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

export function parsePrice(value: string): number {
  const cleaned = value
    .replace(/\./g, "")
    .replace(/\D/g, "");

  return Number(cleaned) || 0;
}

export function formatInputPrice(value: string): string {
  const number = parsePrice(value);

  if (!number) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN").format(number);
}

// Rút gọn số tiền để hiển thị trên biểu đồ: 1.250.000 -> "1,3tr"
export function formatCompactPrice(price: number): string {
  const format = (value: number, unit: string) =>
    `${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 1,
    }).format(value)}${unit}`;

  if (price >= 1_000_000_000) return format(price / 1_000_000_000, " tỷ");
  if (price >= 1_000_000) return format(price / 1_000_000, "tr");
  if (price >= 1_000) return format(price / 1_000, "k");

  return String(price);
}