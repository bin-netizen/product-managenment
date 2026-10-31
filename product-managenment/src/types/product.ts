import type { ProductType, SpecValue } from "../constants/appleCatalog";

export interface ProductColor {
  id: string;
  name: string;
  color: string;
  image: string;
  price: number;
  // Số lượng riêng của màu này. Optional để màu của sản phẩm cũ vẫn hợp lệ.
  quantity?: number;
}

export interface Product {
  id: string;
  name: string;
  // Với sản phẩm mới: chính là tên loại (iPhone, Mac, iPad...) để các trang
  // Categories / Products / Dashboard / CreateOrder tiếp tục lọc được như cũ.
  category: string;

  // Các trường mới đều optional để sản phẩm cũ trong localStorage vẫn hợp lệ.
  productType?: ProductType;
  sku?: string;
  condition?: string;
  warrantyMonths?: number;
  specs?: Record<string, SpecValue>;

  price: number;
  // Tổng kho. Nếu mọi màu đều có quantity riêng thì bằng tổng quantity của các màu.
  quantity: number;
  image: string;

  description: string;

  colors: ProductColor[];

  features: string[];

  createdAt: string;
}

// Dữ liệu form gửi lên khi thêm/sửa (giống tham số của addProduct)
export type ProductInput = Omit<Product, "id" | "createdAt">;

export interface ProductFormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  description: string;
  image: string;

  colors: ProductColor[];

  features: string[];
}