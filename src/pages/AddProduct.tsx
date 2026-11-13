
import { useNavigate } from "react-router-dom";

import ProductForm from "../components/ProductForm";
import { useProducts } from "../context/ProductContext";

export default function AddProduct() {
  const navigate = useNavigate();
  const { addProduct } = useProducts();

  return (
    <ProductForm
      title="Thêm sản phẩm Apple"
      subtitle="Chọn loại sản phẩm, biểu mẫu sẽ hiển thị đúng các trường cần nhập."
      backTo="/products"
      submitLabel="+ Thêm sản phẩm"
      onSubmit={async (values) => {
        try {
          await addProduct(values);

          navigate("/products");
        } catch (error) {
          console.error("Lỗi thêm sản phẩm:", error);

          alert(
            error instanceof Error
              ? error.message
              : "Không thể thêm sản phẩm. Vui lòng thử lại.",
          );
        }
      }}
    />
  );
}
