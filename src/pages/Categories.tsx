import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductContext";

function Categories() {
  const { products } = useProducts();

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category.trim())
        .filter(Boolean)
    )
  );

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            ORGANIZATION
          </span>

          <h1>Categories</h1>

          <p>
            Các danh mục được tạo từ sản phẩm của bạn.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state large">
          <div className="empty-icon">
            ◈
          </div>

          <h3>Chưa có danh mục</h3>

          <p>
            Hãy thêm sản phẩm để tạo danh mục.
          </p>

          <Link
            to="/products/add"
            className="primary-button"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      ) : (
        <div className="category-grid">
          {categories.map((category) => {
            const count = products.filter(
              (product) =>
                product.category.trim() === category
            ).length;

            return (
              <Link
                to="/products"
                className="category-card"
                key={category}
              >
                <div className="category-card-icon">
                  ◈
                </div>

                <div>
                  <h3>{category}</h3>

                  <p>
                    {count} sản phẩm
                  </p>
                </div>

                <span>→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Categories;