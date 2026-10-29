import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../types/product";
import { saveToStorage } from "../utils/storage";
import { tracksColorStock } from "../utils/stock";

export interface StockChange {
  productId: string;
  // Màu bị trừ/cộng kho. Không truyền thì chỉ tác động vào tổng kho (sản phẩm cũ chưa chia kho theo màu).
  colorId?: string;
  // Số dương: cộng vào kho (hoàn hàng). Số âm: trừ kho (bán hàng).
  delta: number;
}

interface ProductContextType {
  products: Product[];

  addProduct: (
    product: Omit<Product, "id" | "createdAt">,
  ) => void;

  updateProduct: (
    id: string,
    product: Partial<Product>,
  ) => void;

  deleteProduct: (id: string) => void;

  getProductById: (id: string) => Product | undefined;

  adjustStock: (changes: StockChange[]) => void;
}

const ProductContext = createContext<
  ProductContextType | undefined
>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "product-management-products";

function loadProducts(): Product[] {
  const savedProducts = localStorage.getItem(STORAGE_KEY);

  if (!savedProducts) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedProducts);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ProductProvider({
  children,
}: ProductProviderProps) {
  const [products, setProducts] =
    useState<Product[]>(loadProducts);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, products);
  }, [products]);

  // Đồng bộ khi mở nhiều tab: tab khác ghi thì tab này cập nhật theo,
  // tránh việc ghi đè dữ liệu bằng bản cũ.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);

        if (Array.isArray(parsed)) {
          setProducts(parsed);
        }
      } catch {
        // bỏ qua dữ liệu hỏng
      }
    };

    window.addEventListener("storage", handleStorage);

    return () =>
      window.removeEventListener("storage", handleStorage);
  }, []);

  // Thêm sản phẩm
  const addProduct = (
    product: Omit<Product, "id" | "createdAt">,
  ) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setProducts((currentProducts) => [
      ...currentProducts,
      newProduct,
    ]);
  };

  // Cập nhật sản phẩm
  const updateProduct = (
    id: string,
    product: Partial<Product>,
  ) => {
    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === id
          ? {
              ...item,
              ...product,
            }
          : item,
      ),
    );
  };

  // Xóa sản phẩm
  const deleteProduct = (id: string) => {
    setProducts((currentProducts) =>
      currentProducts.filter((item) => item.id !== id),
    );
  };

  // Lấy sản phẩm theo ID
  const getProductById = (id: string) => {
    return products.find((product) => product.id === id);
  };

  // Trừ/cộng kho theo đơn hàng. Dùng functional update nên luôn đúng với state mới nhất.
  const adjustStock = (changes: StockChange[]) => {
    const byProduct = new Map<string, StockChange[]>();

    changes.forEach((change) => {
      byProduct.set(change.productId, [
        ...(byProduct.get(change.productId) ?? []),
        change,
      ]);
    });

    setProducts((currentProducts) =>
      currentProducts.map((item) => {
        const list = byProduct.get(item.id);

        if (!list) {
          return item;
        }

        // Kho chia theo màu: cập nhật từng màu rồi cộng lại thành tổng kho
        if (tracksColorStock(item)) {
          const deltas = new Map<string, number>();

          list.forEach(({ colorId, delta }) => {
            if (colorId) {
              deltas.set(colorId, (deltas.get(colorId) ?? 0) + delta);
            }
          });

          const colors = item.colors.map((color) => {
            const delta = deltas.get(color.id);

            return delta === undefined
              ? color
              : {
                  ...color,
                  quantity: Math.max(0, (color.quantity ?? 0) + delta),
                };
          });

          return {
            ...item,
            colors,
            quantity: colors.reduce(
              (sum, color) => sum + (color.quantity ?? 0),
              0,
            ),
          };
        }

        // Sản phẩm cũ: một kho chung
        const delta = list.reduce((sum, change) => sum + change.delta, 0);

        return {
          ...item,
          quantity: Math.max(0, item.quantity + delta),
        };
      }),
    );
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        adjustStock,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

// Hook sử dụng ProductContext
// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts phải được sử dụng bên trong ProductProvider",
    );
  }

  return context;
}