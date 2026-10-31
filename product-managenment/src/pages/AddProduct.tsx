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
      onSubmit={(values) => {
        addProduct(values);
        navigate("/products");
      }}
    />
  );
}