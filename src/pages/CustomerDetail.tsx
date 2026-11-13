import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import { useOrders } from "../context/OrderContext";
import { getCustomerByKey } from "../utils/customers";
import { formatPrice } from "../utils/format";
import {
  formatDateTime,
  installmentOutstanding,
  PAYMENT_LABEL,
} from "../utils/orders";

export default function CustomerDetail() {
  // Nhận cả :customerId (bản mới) lẫn :phone (bản cũ) để dán lệch file giữa các đợt không bị lỗi
  const params = useParams();
  const customerId = params.customerId ?? params.phone;
  const { orders } = useOrders();

  const customer = useMemo(
    () =>
      customerId ? getCustomerByKey(orders, customerId) : undefined,
    [orders, customerId],
  );

  if (!customer) {
    return (
      <div className="page">
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-icon">❌</div>

            <h3>Không tìm thấy khách hàng</h3>

            <p>
              Khách này chưa có đơn nào, hoặc các đơn của họ đã không
              còn số điện thoại này.
            </p>

            <Link to="/customers" className="primary-button">
              ← Quay lại khách hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CUSTOMER</span>

          <h1>
            {customer.name}{" "}
            {customer.code && (
              <span className="customer-code">{customer.code}</span>
            )}
          </h1>

          <p>
            <a href={`tel:${customer.phone}`}>{customer.phone}</a> · Khách
            từ {formatDateTime(customer.firstOrderAt)}
          </p>
        </div>

        <div className="detail-header-actions">
          <Link to="/customers" className="secondary-button">
            ← Danh sách
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
            <span>Đã mua (đơn hoàn thành)</span>
            <strong>{formatPrice(customer.totalSpent)}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">☰</div>

          <div>
            <span>Số đơn</span>
            <strong>{customer.orderCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">⏱</div>

          <div>
            <span>Còn nợ trả góp</span>
            <strong
              className={customer.outstanding > 0 ? "debt-text" : undefined}
            >
              {formatPrice(customer.outstanding)}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">✓</div>

          <div>
            <span>Đơn hoàn thành / đã hủy</span>
            <strong>
              {customer.completedCount} / {customer.cancelledCount}
            </strong>
          </div>
        </div>
      </div>

      <section className="content-card">
        <div className="detail-section-title">
          <span className="detail-section-icon">🧾</span>

          <div>
            <h3>Lịch sử đơn hàng</h3>

            <p>Mới nhất ở trên cùng. Bấm mã đơn để xem chi tiết.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Thời gian</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
                <th>Còn phải thu</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {customer.orders.map((order) => {
                const owed = installmentOutstanding(order);

                return (
                  <tr key={order.id}>
                    <td>
                      <Link
                        to={`/orders/${order.id}`}
                        className="order-product-link"
                      >
                        <strong>{order.code}</strong>
                      </Link>
                    </td>

                    <td>{formatDateTime(order.createdAt)}</td>

                    <td>{PAYMENT_LABEL[order.paymentMethod]}</td>

                    <td>
                      <strong className="cell-strong">
                        {formatPrice(order.total)}
                      </strong>
                    </td>

                    <td>
                      {owed > 0 ? (
                        <strong className="debt-text">
                          {formatPrice(owed)}
                        </strong>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}