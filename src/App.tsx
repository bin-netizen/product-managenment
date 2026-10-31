import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import CreateOrder from "./pages/CreateOrder";
import OrderDetail from "./pages/OrderDetail";

import StorageWarning from "./components/StorageWarning";

import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";

import "./App.css";

function App() {
  return (
    <ProductProvider>
      <OrderProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />

          <div className="main-layout">
            <Header />

            <main className="main-content">
              <StorageWarning />

              <Routes>
                <Route
                  path="/"
                  element={<Dashboard />}
                />

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
                  path="/categories"
                  element={<Categories />}
                />

                <Route
                  path="*"
                  element={<Dashboard />}
                />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
      </OrderProvider>
    </ProductProvider>
  );
}

export default App;