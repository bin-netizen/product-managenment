
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
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
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Login from "./pages/Login";

import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";

import "./App.css";

// Giao diện chính sau khi đăng nhập
function AppLayout() {
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
    <ProductProvider>
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            {/* Trang đăng nhập không yêu cầu JWT */}
            <Route path="/login" element={<Login />} />

            {/* Các trang còn lại yêu cầu đăng nhập */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />

                <Route
                  path="/products"
                  element={<Products />}
                />

                <Route
                  path="/products/add"
                  element={<AddProduct />}
                />

                <Route
                  path="/products/:id"
                  element={<ProductDetail />}
                />

                <Route
                  path="/products/:id/edit"
                  element={<EditProduct />}
                />

                <Route
                  path="/orders"
                  element={<Orders />}
                />

                <Route
                  path="/orders/new"
                  element={<CreateOrder />}
                />

                <Route
                  path="/orders/:id"
                  element={<OrderDetail />}
                />

                <Route
                  path="/customers"
                  element={<Customers />}
                />

                <Route
                  path="/customers/:customerId"
                  element={<CustomerDetail />}
                />

                <Route
                  path="/categories"
                  element={<Categories />}
                />

                <Route path="*" element={<Dashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </ProductProvider>
  );
}

export default App;
