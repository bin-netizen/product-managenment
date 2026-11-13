
import type { Product } from "../types/product";

const API_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/products`;

type ApiProductData = Record<string, unknown>;

// Kiểm tra phản hồi từ API
async function checkResponse(response: Response): Promise<void> {
  if (response.status === 401) {
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

// Chuyển dữ liệu từ NestJS sang Product của React
function normalizeProduct(value: unknown): Product {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error("Dữ liệu sản phẩm không hợp lệ");
  }

  const data = value as ApiProductData;

  const name =
    typeof data.name === "string" ? data.name : "";

  const category =
    typeof data.category === "string"
      ? data.category
      : typeof data.productType === "string"
        ? data.productType
        : "";

  // Ưu tiên UUID cũ, không dùng ID tự tăng của MySQL
  const logicalId =
    data.clientId ?? data.client_id ?? data.id;

  if (!name || !category || logicalId == null) {
    throw new Error(
      "Sản phẩm thiếu tên, danh mục hoặc mã định danh",
    );
  }

  return {
    ...(data as Partial<Product>),
    id: String(logicalId),
    name,
    category,
    price: Number(data.price ?? 0),
    quantity: Number(data.quantity ?? data.stock ?? 0),

    productType: data.productType as Product["productType"],

    sku:
      typeof data.sku === "string" ? data.sku : undefined,

    condition:
      typeof data.condition === "string"
        ? data.condition
        : typeof data.condition_status === "string"
          ? data.condition_status
          : undefined,

    warrantyMonths:
      data.warrantyMonths == null &&
      data.warranty_months == null
        ? undefined
        : Number(
            data.warrantyMonths ?? data.warranty_months,
          ),

    image: typeof data.image === "string" ? data.image : "",

    media: Array.isArray(data.media)
      ? data.media as Product["media"]
      : [],

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    colors: Array.isArray(data.colors)
      ? data.colors as Product["colors"]
      : [],

    specs:
      typeof data.specs === "object" &&
      data.specs !== null &&
      !Array.isArray(data.specs)
        ? data.specs as Product["specs"]
        : {},

    features: Array.isArray(data.features)
      ? data.features as Product["features"]
      : [],

    createdAt: data.createdAt
      ? new Date(String(data.createdAt)).toISOString()
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

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Dữ liệu danh sách sản phẩm không hợp lệ");
  }

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
