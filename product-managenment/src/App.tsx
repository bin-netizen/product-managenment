
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StorageWarning from "./components/StorageWarning";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import CreateOrder from "./pages/CreateOrder";
import OrderDetail from "./pages/OrderDetail";
import Login from "./pages/Login";

import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";

import "./App.css";

// Layout dành cho người dùng đã đăng nhập
function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-layout">
        <Header />

        <main className="main-content">
          <StorageWarning />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <OrderProvider>
          <BrowserRouter>
            <Routes>
              {/* Trang đăng nhập */}
              <Route path="/login" element={<Login />} />

              {/* Các trang yêu cầu đăng nhập */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />

                  <Route path="/products" element={<Products />} />
                  <Route path="/products/add" element={<AddProduct />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/products/:id/edit" element={<EditProduct />} />

                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/new" element={<CreateOrder />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />

                  <Route path="/categories" element={<Categories />} />
                </Route>
              </Route>

              {/* Đường dẫn không tồn tại */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </OrderProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
