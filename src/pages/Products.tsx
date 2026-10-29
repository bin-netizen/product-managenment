import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { formatPrice } from "../utils/format";
import { salesByProduct } from "../utils/orders";

type StockFilter = "all" | "in" | "low" | "out";

const LOW_STOCK_LIMIT = 10;

function Products() {
  const { products } = useProducts();
  const { orders } = useOrders();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState<StockFilter>("all");

  const sold = useMemo(() => salesByProduct(orders), [orders]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category.trim())
            .filter(Boolean),
        ),
      ),
    [products],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      if (
        keyword &&
        !product.name.toLowerCase().includes(keyword) &&
        !product.category.toLowerCase().includes(keyword)
      ) {
        return false;
      }

      if (category && product.category.trim() !== category) {
        return false;
      }

      if (stock === "out") return product.quantity <= 0;
      if (stock === "low")
        return (
          product.quantity > 0 &&
          product.quantity <= LOW_STOCK_LIMIT
        );
      if (stock === "in") return product.quantity > LOW_STOCK_LIMIT;

      return true;
    });
  }, [products, search, category, stock]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRODUCT CATALOG</span>

          <h1>Products</h1>

          <p>Danh sách sản phẩm, tồn kho và số lượng đã bán.</p>
        </div>

        <Link to="/products/add" className="primary-button">
          + Thêm sản phẩm
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state large">
          <div className="empty-icon">📦</div>

          <h3>Chưa có sản phẩm nào</h3>

          <p>Bạn chưa thêm sản phẩm vào hệ thống.</p>

          <Link to="/products/add" className="primary-button">
            + Thêm sản phẩm đầu tiên
          </Link>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <input
              type="search"
              placeholder="Tìm theo tên hoặc hãng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Tất cả hãng</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={stock}
              onChange={(event) =>
                setStock(event.target.value as StockFilter)
              }
            >
              <option value="all">Mọi tồn kho</option>
              <option value="in">Còn hàng</option>
              <option value="low">Sắp hết (≤ {LOW_STOCK_LIMIT})</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="sale-empty">
              Không có sản phẩm phù hợp với bộ lọc.
            </p>
          ) : (
            <div className="product-grid">
              {filtered.map((product) => {
                const soldQty =
                  sold.get(product.id)?.quantity ?? 0;

                return (
                  <Link
                    to={`/products/${product.id}`}
                    className="product-card"
                    key={product.id}
                  >
                    <div className="product-image">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                        />
                      ) : (
                        <div className="product-image-empty">
                          📦
                        </div>
                      )}

                      <span className="product-category">
                        {product.category}
                      </span>
                    </div>

                    <div className="product-content">
                      <h3>{product.name}</h3>

                      <p>{product.description}</p>

                      <div className="product-bottom">
                        <strong>{formatPrice(product.price)}</strong>

                        <span
                          className={
                            product.quantity <= 0
                              ? "stock out"
                              : product.quantity <= LOW_STOCK_LIMIT
                                ? "stock low"
                                : "stock"
                          }
                        >
                          {product.quantity <= 0
                            ? "Hết hàng"
                            : `${product.quantity} trong kho`}
                        </span>
                      </div>

                      <div className="product-sold">
                        Đã bán: <strong>{soldQty}</strong>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Products;