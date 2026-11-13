import { Link, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";
import { FaApple } from "react-icons/fa";
import {
  FiFilePlus,
  FiGrid,
  FiHome,
  FiList,
  FiPackage,
  FiPlusCircle,
  FiUsers,
} from "react-icons/fi";
import "./AppleShell.css";

interface NavEntry {
  to: string;
  icon: IconType;
  label: string;
  isActive: (pathname: string) => boolean;
}

// Bỏ dấu "/" ở cuối để "/orders/new/" vẫn khớp
const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const NAV_ITEMS: NavEntry[] = [
  { to: "/", icon: FiHome, label: "Tổng quan", isActive: (p) => p === "/" },
  {
    to: "/orders/new",
    icon: FiFilePlus,
    label: "Tạo đơn hàng",
    isActive: (p) => p === "/orders/new",
  },
  {
    to: "/orders",
    icon: FiList,
    label: "Đơn hàng",
    isActive: (p) => p.startsWith("/orders") && p !== "/orders/new",
  },
  {
    to: "/customers",
    icon: FiUsers,
    label: "Khách hàng",
    isActive: (p) => p.startsWith("/customers"),
  },
  {
    to: "/products",
    icon: FiPackage,
    label: "Sản phẩm",
    isActive: (p) => p.startsWith("/products") && p !== "/products/add",
  },
  {
    to: "/products/add",
    icon: FiPlusCircle,
    label: "Thêm sản phẩm",
    isActive: (p) => p === "/products/add",
  },
  {
    to: "/categories",
    icon: FiGrid,
    label: "Danh mục",
    isActive: (p) => p.startsWith("/categories"),
  },
];

function Sidebar() {
  const { pathname } = useLocation();
  const path = normalize(pathname);

  return (
    <aside className="sidebar no-print">
      <div className="logo">
        <div className="logo-icon">
          <FaApple size={22} aria-hidden="true" />
        </div>
        <div>
          <h1>Quản lý</h1>
          <span>Sản phẩm</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(path);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={active ? "nav-item active" : "nav-item"}
              aria-current={active ? "page" : undefined}
            >
              <span className="nav-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="avatar">A</div>
          <div>
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;