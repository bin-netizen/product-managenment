
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../types/product";

import {
  fetchProducts,
  createProduct,
  updateProductApi,
  deleteProductApi,
} from "../services/productApi";

import { adjustStockApi } from "../services/stockApi";

export interface StockChange {
  productId: string;
  colorId?: string;
  delta: number;
}

export type StockAction = "deduct" | "restore";

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;

  addProduct: (
    product: Omit<Product, "id" | "createdAt">,
  ) => Promise<Product>;

  updateProduct: (
    id: string,
    product: Partial<Product>,
  ) => Promise<Product>;

  deleteProduct: (id: string) => Promise<void>;

  getProductById: (id: string) => Product | undefined;

  adjustStock: (
    changes: StockChange[],
    operationId: string,
    action: StockAction,
  ) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // TẢI SẢN PHẨM TỪ MYSQL
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProductsFromApi() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchProducts();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải sản phẩm từ máy chủ",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProductsFromApi();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // THÊM SẢN PHẨM
  // =====================================================

  const addProduct = async (
    product: Omit<Product, "id" | "createdAt">,
  ): Promise<Product> => {
    const newProduct = await createProduct(product);

    setProducts((current) => [
      ...current,
      newProduct,
    ]);

    return newProduct;
  };

  // =====================================================
  // CẬP NHẬT SẢN PHẨM
  // =====================================================

  const updateProduct = async (
    id: string,
    product: Partial<Product>,
  ): Promise<Product> => {
    const updatedProduct = await updateProductApi(
      id,
      product,
    );

    setProducts((current) =>
      current.map((item) =>
        item.id === id ? updatedProduct : item,
      ),
    );

    return updatedProduct;
  };

  // =====================================================
  // XÓA SẢN PHẨM
  // =====================================================

  const deleteProduct = async (
    id: string,
  ): Promise<void> => {
    await deleteProductApi(id);

    setProducts((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  // =====================================================
  // LẤY SẢN PHẨM THEO ID
  // =====================================================

  const getProductById = (id: string) => {
    return products.find(
      (product) => product.id === id,
    );
  };

  // =====================================================
  // ĐIỀU CHỈNH TỒN KHO TRONG MYSQL
  // =====================================================

  const adjustStock = async (
    changes: StockChange[],
    operationId: string,
    action: StockAction,
  ): Promise<void> => {
    if (changes.length === 0) {
      return;
    }

    if (!operationId.trim()) {
      throw new Error(
        "Mã thao tác tồn kho không hợp lệ.",
      );
    }

    // Gửi yêu cầu cập nhật tồn kho đến NestJS.
    // Backend sẽ kiểm tra tồn kho và cập nhật bằng transaction.
    await adjustStockApi({
      operationId,
      action,
      changes,
    });

    // Tải lại dữ liệu mới nhất từ MySQL.
    // Nếu việc tải lại thất bại, không báo thao tác kho thất bại
    // vì backend đã cập nhật tồn kho thành công.
    try {
      const refreshedProducts = await fetchProducts();

      setProducts(refreshedProducts);
      setError(null);
    } catch (err) {
      console.error(
        "Tồn kho đã cập nhật nhưng không thể tải lại danh sách sản phẩm:",
        err,
      );

      setError(
        "Tồn kho đã được cập nhật trên máy chủ, nhưng chưa thể tải lại dữ liệu. Vui lòng tải lại trang.",
      );
    }
  };

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        error,
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
