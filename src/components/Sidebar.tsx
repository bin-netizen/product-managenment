import { NavLink, useLocation } from "react-router-dom";

interface NavEntry {
  to: string;
  icon: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavEntry[] = [
  {
    to: "/",
    icon: "⌂",
    label: "Dashboard",
    isActive: (path) => path === "/",
  },
  {
    to: "/orders/new",
    icon: "＄",
    label: "New Order",
    isActive: (path) => path === "/orders/new",
  },
  {
    to: "/orders",
    icon: "☰",
    label: "Orders",
    isActive: (path) =>
      path.startsWith("/orders") && path !== "/orders/new",
  },
  {
    to: "/products",
    icon: "▣",
    label: "Products",
    isActive: (path) =>
      path.startsWith("/products") && path !== "/products/add",
  },
  {
    to: "/products/add",
    icon: "＋",
    label: "Add Product",
    isActive: (path) => path === "/products/add",
  },
  {
    to: "/categories",
    icon: "◈",
    label: "Categories",
    isActive: (path) => path === "/categories",
  },
];

function Sidebar() {
  const { pathname } = useLocation();

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
          <NavLink
            key={item.to}
            to={item.to}
            className={
              item.isActive(pathname)
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
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