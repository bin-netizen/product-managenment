import { Link, useLocation } from "react-router-dom";

interface NavEntry {
  to: string;
  icon: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

// Bỏ dấu "/" ở cuối để "/orders/new/" vẫn khớp
const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

const NAV_ITEMS: NavEntry[] = [
  { to: "/", icon: "⌂", label: "Dashboard", isActive: (p) => p === "/" },
  { to: "/orders/new", icon: "＄", label: "New Order", isActive: (p) => p === "/orders/new" },
  {
    to: "/orders",
    icon: "☰",
    label: "Orders",
    isActive: (p) => p.startsWith("/orders") && p !== "/orders/new",
  },
  {
    to: "/products",
    icon: "▣",
    label: "Products",
    isActive: (p) => p.startsWith("/products") && p !== "/products/add",
  },
  { to: "/products/add", icon: "＋", label: "Add Product", isActive: (p) => p === "/products/add" },
  { to: "/categories", icon: "◈", label: "Categories", isActive: (p) => p.startsWith("/categories") },
];

function Sidebar() {
  const { pathname } = useLocation();
  const path = normalize(pathname);

  return (
    <aside className="sidebar no-print">
      <div className="logo">
        <div className="logo-icon">S</div>
        <div>
          <h1>Sales</h1>
          <span>Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="menu-title">MENU</p>

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={item.isActive(path) ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
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