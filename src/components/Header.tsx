import { useLocation } from "react-router-dom";

function getTitle(pathname: string): string {
  if (pathname === "/") return "Tổng quan bán hàng";
  if (pathname === "/orders/new") return "Tạo đơn bán hàng";
  if (pathname.startsWith("/orders")) return "Quản lý đơn hàng";
  if (pathname === "/products/add") return "Thêm sản phẩm";
  if (pathname.startsWith("/products")) return "Quản lý sản phẩm";
  if (pathname === "/categories") return "Danh mục";

  return "Tổng quan bán hàng";
}

function Header() {
  const { pathname } = useLocation();

  return (
    <header className="header no-print">
      <div>
        <p className="header-label">
          SALES MANAGEMENT
        </p>

        <h2>{getTitle(pathname)}</h2>
      </div>

      <div className="header-right">
        <div className="notification">
          🔔
        </div>

        <div className="header-avatar">
          A
        </div>
      </div>
    </header>
  );
}

export default Header;