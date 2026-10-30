
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../types/product";
import { tracksColorStock } from "../utils/stock";

import {
  fetchProducts,
  createProduct,
  updateProductApi,
  deleteProductApi,
} from "../services/productApi";

export interface StockChange {
  productId: string;
  colorId?: string;
  delta: number;
}

interface ProductContextType {
  products: Product[];

  addProduct: (
    product: Omit<Product, "id" | "createdAt">,
  ) => Promise<void>;

  updateProduct: (
    id: string,
    product: Partial<Product>,
  ) => Promise<void>;

  deleteProduct: (id: string) => Promise<void>;

  getProductById: (id: string) => Product | undefined;

  adjustStock: (changes: StockChange[]) => Promise<void>;
}

const ProductContext = createContext<
  ProductContextType | undefined
>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export function ProductProvider({
  children,
}: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);

  // Lấy dữ liệu sản phẩm từ MySQL thông qua NestJS
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
        console.log("Đã tải sản phẩm từ MySQL:", data);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      }
    };

    loadProducts();
  }, []);

  // Thêm sản phẩm
  const addProduct = async (
    product: Omit<Product, "id" | "createdAt">,
  ) => {
    try {
      const newProduct = await createProduct(product);

      setProducts((currentProducts) => [
        ...currentProducts,
        newProduct,
      ]);
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      throw error;
    }
  };

  // Cập nhật sản phẩm
  const updateProduct = async (
    id: string,
    product: Partial<Product>,
  ) => {
    try {
      const updatedProduct = await updateProductApi(id, product);

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === id ? updatedProduct : item,
        ),
      );
    } catch (error) {
      console.error("Lỗi cập nhật sản phẩm:", error);
      throw error;
    }
  };

  // Xóa sản phẩm
  const deleteProduct = async (id: string) => {
    try {
      await deleteProductApi(id);

      setProducts((currentProducts) =>
        currentProducts.filter((item) => item.id !== id),
      );
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      throw error;
    }
  };

  // Lấy sản phẩm theo ID
  const getProductById = (id: string) => {
    return products.find((product) => product.id === id);
  };

  // Cộng/trừ tồn kho và lưu thay đổi vào MySQL
  const adjustStock = async (changes: StockChange[]) => {
    const byProduct = new Map<string, StockChange[]>();

    changes.forEach((change) => {
      byProduct.set(change.productId, [
        ...(byProduct.get(change.productId) ?? []),
        change,
      ]);
    });

    const updatedProducts: Product[] = [];

    for (const item of products) {
      const list = byProduct.get(item.id);

      if (!list) continue;

      let updatedItem: Product;

      // Sản phẩm quản lý kho riêng theo màu
      if (tracksColorStock(item)) {
        const deltas = new Map<string, number>();

        list.forEach(({ colorId, delta }) => {
          if (colorId) {
            deltas.set(
              colorId,
              (deltas.get(colorId) ?? 0) + delta,
            );
          }
        });

        const colors = item.colors.map((color) => {
          const delta = deltas.get(color.id);

          return delta === undefined
            ? color
            : {
                ...color,
                quantity: Math.max(
                  0,
                  (color.quantity ?? 0) + delta,
                ),
              };
        });

        updatedItem = {
          ...item,
          colors,
          quantity: colors.reduce(
            (sum, color) => sum + (color.quantity ?? 0),
            0,
          ),
        };
      } else {
        // Sản phẩm sử dụng kho chung
        const delta = list.reduce(
          (sum, change) => sum + change.delta,
          0,
        );

        updatedItem = {
          ...item,
          quantity: Math.max(0, item.quantity + delta),
        };
      }

      updatedProducts.push(updatedItem);
    }

    try {
      // Lưu từng sản phẩm đã thay đổi vào MySQL
      const savedProducts = await Promise.all(
        updatedProducts.map((item) =>
          updateProductApi(item.id, {
            quantity: item.quantity,
            colors: item.colors,
          }),
        ),
      );

      setProducts((currentProducts) =>
        currentProducts.map((item) => {
          const saved = savedProducts.find(
            (product) => product.id === item.id,
          );

          return saved ?? item;
        }),
      );
    } catch (error) {
      console.error("Lỗi cập nhật tồn kho:", error);
      throw error;
    }
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
