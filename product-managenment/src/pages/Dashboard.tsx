import { Link } from "react-router-dom";

import ProductThumb from "../components/ProductThumb";
import StatusBadge from "../components/StatusBadge";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { formatCompactPrice, formatPrice } from "../utils/format";
import {
  formatDateTime,
  lastDaysRevenue,
  topProducts,
  totalRevenue,
} from "../utils/orders";

const LOW_STOCK_LIMIT = 10;

function Dashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();

  // ===== Bán hàng =====
  const week = lastDaysRevenue(orders, 7);
  const today = week[week.length - 1];
  const weekRevenue = week.reduce(
    (sum, day) => sum + day.revenue,
    0,
  );
  const maxRevenue = Math.max(...week.map((day) => day.revenue), 1);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;

  const best = topProducts(orders, 5);
  const recentOrders = orders.slice(0, 6);

  // ===== Kho hàng =====
  const totalStock = products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  const categories = new Set(
    products.map((product) => product.category),
  ).size;

  const stockValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  );

  const lowStock = products
    .filter((product) => product.quantity <= LOW_STOCK_LIMIT)
    .sort((a, b) => a.quantity - b.quantity);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>

          <h1>Dashboard</h1>

          <p>Theo dõi doanh thu, đơn hàng và tồn kho của bạn.</p>
        </div>

        <div className="heading-actions">
          <Link to="/products/add" className="secondary-button">
            + Thêm sản phẩm
          </Link>

          <Link to="/orders/new" className="primary-button">
            + Tạo đơn bán
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">₫</div>

          <div>
            <span>Tổng doanh thu</span>
            <strong>{formatPrice(totalRevenue(orders))}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">☀</div>

          <div>
            <span>Doanh thu hôm nay</span>
            <strong>{formatPrice(today.revenue)}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">☰</div>

          <div>
            <span>Tổng đơn hàng</span>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">⏱</div>

          <div>
            <span>Đơn chờ xử lý</span>
            <strong>{pendingOrders}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="content-card">
          <div className="section-header">
            <h2>Doanh thu 7 ngày qua</h2>

            <p>
              Tổng: {formatPrice(weekRevenue)} (chỉ tính đơn đã
              hoàn thành)
            </p>
          </div>

          <div className="bar-chart" role="img" aria-label="Biểu đồ doanh thu 7 ngày">
            {week.map((day) => (
              <div
                className="bar-col"
                key={day.key}
                title={`${day.label}: ${formatPrice(day.revenue)} · ${day.orders} đơn`}
              >
                <span className="bar-value">
                  {day.revenue > 0
                    ? formatCompactPrice(day.revenue)
                    : ""}
                </span>

                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(day.revenue / maxRevenue) * 100}%`,
                    }}
                  />
                </div>

                <span className="bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-card">
          <div className="section-header">
            <h2>Bán chạy nhất</h2>

            <p>Theo số lượng đã bán (đơn hoàn thành)</p>
          </div>

          {best.length === 0 ? (
            <p className="sale-empty">
              Chưa có đơn hoàn thành nào.
            </p>
          ) : (
            <ol className="rank-list">
              {best.map((item, index) => (
                <li key={item.productId}>
                  <span className="rank-number">{index + 1}</span>

                  <div>
                    <strong>{item.name}</strong>

                    <span>{formatPrice(item.revenue)}</span>
                  </div>

                  <em>{item.quantity} đã bán</em>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">▣</div>

          <div>
            <span>Tổng sản phẩm</span>
            <strong>{products.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">◈</div>

          <div>
            <span>Danh mục</span>
            <strong>{categories}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✓</div>

          <div>
            <span>Tồn kho</span>
            <strong>{totalStock}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">₫</div>

          <div>
            <span>Giá trị tồn kho</span>
            <strong>{formatPrice(stockValue)}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid wide-left">
        <section className="content-card">
          <div className="section-header">
            <h2>Đơn hàng gần đây</h2>

            <p>6 đơn mới nhất.</p>
          </div>

          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>

              <h3>Chưa có đơn hàng</h3>

              <p>Tạo đơn bán đầu tiên của bạn.</p>

              <Link to="/orders/new" className="primary-button">
                + Tạo đơn bán
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Thời gian</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          className="order-code"
                          to={`/orders/${order.id}`}
                        >
                          {order.code}
                        </Link>
                      </td>

                      <td>{order.customerName || "Khách lẻ"}</td>

                      <td>{formatDateTime(order.createdAt)}</td>

                      <td>
                        <strong className="cell-strong">
                          {formatPrice(order.total)}
                        </strong>
                      </td>

                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="content-card">
          <div className="section-header">
            <h2>Cảnh báo tồn kho</h2>

            <p>
              Sản phẩm còn từ {LOW_STOCK_LIMIT} trở xuống.
            </p>
          </div>

          {lowStock.length === 0 ? (
            <p className="sale-empty">
              Tồn kho đang ổn, không có sản phẩm sắp hết.
            </p>
          ) : (
            <ul className="alert-list">
              {lowStock.slice(0, 6).map((product) => (
                <li key={product.id}>
                  <ProductThumb
                    src={product.image}
                    alt={product.name}
                    size={40}
                  />

                  <Link to={`/products/${product.id}`}>
                    {product.name}
                  </Link>

                  <em
                    className={
                      product.quantity === 0
                        ? "stock out"
                        : "stock low"
                    }
                  >
                    {product.quantity === 0
                      ? "Hết hàng"
                      : `Còn ${product.quantity}`}
                  </em>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;