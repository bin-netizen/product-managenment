import { Link, useNavigate, useParams } from "react-router-dom";

import ProductForm from "../components/ProductForm";
import { useProducts } from "../context/ProductContext";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, updateProduct } = useProducts();

  const product = id ? getProductById(id) : undefined;

  if (!product) {
    return (
      <div className="page">
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-icon">❌</div>

            <h3>Không tìm thấy sản phẩm</h3>

            <p>Sản phẩm bạn muốn chỉnh sửa không tồn tại.</p>

            <Link to="/products" className="primary-button">
              ← Quay lại sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      key={product.id}
      initial={product}
      title="Chỉnh sửa sản phẩm"
      subtitle="Cập nhật thông tin, thông số, màu sắc và tính năng sản phẩm."
      backTo={`/products/${product.id}`}
      submitLabel="Lưu thay đổi"
      onSubmit={(values) => {
        updateProduct(product.id, values);
        navigate(`/products/${product.id}`);
      }}
    />
  );
}