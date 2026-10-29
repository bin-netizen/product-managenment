import type { Product, ProductColor } from "../types/product";

/** Màu có kho riêng (đã nhập số lượng cho màu đó). Màu tạo từ phiên bản cũ thì chưa có. */
export function hasOwnStock(
  color: ProductColor | undefined,
): color is ProductColor & { quantity: number } {
  return typeof color?.quantity === "number";
}

export function findColor(product: Product, colorId?: string) {
  return colorId
    ? product.colors?.find((color) => color.id === colorId)
    : undefined;
}

/** Số lượng có thể bán của (sản phẩm, màu). Màu chưa có kho riêng dùng chung kho của sản phẩm. */
export function availableStock(product: Product, colorId?: string): number {
  const color = findColor(product, colorId);
  return hasOwnStock(color) ? color.quantity : product.quantity;
}

/** Khóa của "kho" mà (sản phẩm, màu) trừ vào — dùng để cộng dồn số lượng trong giỏ hàng. */
export function stockPoolKey(product: Product, colorId?: string): string {
  const color = findColor(product, colorId);
  return hasOwnStock(color) ? `${product.id}:${color.id}` : product.id;
}

/** Sản phẩm quản lý kho theo từng màu: có màu và màu nào cũng có số lượng riêng. */
export function tracksColorStock(product: Pick<Product, "colors">): boolean {
  return (
    !!product.colors &&
    product.colors.length > 0 &&
    product.colors.every((color) => hasOwnStock(color))
  );
}