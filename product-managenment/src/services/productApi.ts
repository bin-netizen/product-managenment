
import type { Product } from "../types/product";

const API_URL = "http://localhost:3000/products";

// Kiểm tra phản hồi từ API
async function checkResponse(response: Response): Promise<void> {
  if (response.status === 401) {
    // Thông báo cho AuthContext biết phiên đăng nhập không hợp lệ
    window.dispatchEvent(new Event("auth:unauthorized"));

    throw new Error(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    );
  }
}

// Tạo headers có kèm JWT
function getHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Chuyển dữ liệu từ MySQL/NestJS sang kiểu Product của React
function normalizeProduct(data: any): Product {
  return {
    ...data,
    id: String(data.id),
    price: Number(data.price),
    quantity: Number(data.quantity ?? data.stock ?? 0),
    productType: data.productType ?? undefined,
    condition: data.condition ?? undefined,
    warrantyMonths:
      data.warrantyMonths == null
        ? undefined
        : Number(data.warrantyMonths),
    image: data.image ?? "",
    description: data.description ?? "",
    colors: data.colors ?? [],
    specs: data.specs ?? {},
    features: data.features ?? [],
    createdAt: data.createdAt
      ? new Date(data.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

// Lấy danh sách sản phẩm
export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(API_URL, {
    headers: getHeaders(),
  });

  await checkResponse(response);

  if (!response.ok) {
    throw new Error("Không thể tải danh sách sản phẩm");
  }

  const data = await response.json();

  return data.map(normalizeProduct);
}

// Thêm sản phẩm
export async function createProduct(
  product: Omit<Product, "id" | "createdAt">,
): Promise<Product> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(product),
  });

  await checkResponse(response);

  if (!response.ok) {
    throw new Error("Không thể thêm sản phẩm");
  }

  return normalizeProduct(await response.json());
}

// Cập nhật sản phẩm
export async function updateProductApi(
  id: string,
  product: Partial<Product>,
): Promise<Product> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(product),
    },
  );

  await checkResponse(response);

  if (!response.ok) {
    throw new Error("Không thể cập nhật sản phẩm");
  }

  return normalizeProduct(await response.json());
}

// Xóa sản phẩm
export async function deleteProductApi(id: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  await checkResponse(response);

  if (!response.ok) {
    throw new Error("Không thể xóa sản phẩm");
  }
}
