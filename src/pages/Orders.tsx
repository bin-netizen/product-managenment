import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import { useOrders } from "../context/OrderContext";
import type { OrderStatus } from "../types/order";
import { formatPrice } from "../utils/format";
import {
  formatDateTime,
  ordersToCsv,
  PAYMENT_LABEL,
  STATUS_LABEL,
  totalRevenue,
} from "../utils/orders";

type StatusFilter = "all" | OrderStatus;
type PeriodFilter = "all" | "today" | "7" | "30";

const DAY = 24 * 60 * 60 * 1000;

function startOfToday(): number {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
}

export default function Orders() {
  const { orders } = useOrders();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      completed: orders.filter((o) => o.status === "completed")
        .length,
      cancelled: orders.filter((o) => o.status === "cancelled")
        .length,
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const since =
      period === "all"
        ? 0
        : period === "today"
          ? startOfToday()
          : startOfToday() - (Number(period) - 1) * DAY;

    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) {
        return false;
      }

      if (new Date(order.createdAt).getTime() < since) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        order.code.toLowerCase().includes(keyword) ||
        order.customerName.toLowerCase().includes(keyword) ||
        order.customerPhone.includes(keyword) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(keyword),
        )
      );
    });
  }, [orders, status, period, search]);

  const handleExport = () => {
    const blob = new Blob([ordersToCsv(filtered)], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `don-hang-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: STATUS_LABEL.pending },
    { value: "completed", label: STATUS_LABEL.completed },
    { value: "cancelled", label: STATUS_LABEL.cancelled },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SALES</span>

          <h1>Đơn hàng</h1>

          <p>Theo dõi, xử lý và xuất báo cáo các đơn đã bán.</p>
        </div>

        <Link to="/orders/new" className="primary-button">
          + Tạo đơn bán
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state large">
          <div className="empty-icon">🧾</div>

          <h3>Chưa có đơn hàng nào</h3>

          <p>Tạo đơn đầu tiên để bắt đầu theo dõi doanh thu.</p>

          <Link to="/orders/new" className="primary-button">
            + Tạo đơn bán
          </Link>
        </div>
      ) : (
        <section className="content-card">
          <div className="orders-toolbar">
            <div className="tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.value}
                  className={
                    status === tab.value ? "tab active" : "tab"
                  }
                  onClick={() => setStatus(tab.value)}
                >
                  {tab.label}
                  <span>{counts[tab.value]}</span>
                </button>
              ))}
            </div>

            <div className="orders-filters">
              <input
                type="search"
                placeholder="Tìm mã đơn, khách, SĐT, sản phẩm..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as PeriodFilter)
                }
              >
                <option value="all">Mọi thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
              </select>

              <button
                type="button"
                className="secondary-button"
                disabled={filtered.length === 0}
                onClick={handleExport}
              >
                ⬇ Xuất CSV
              </button>
            </div>
          </div>

          <div className="orders-summary">
            <span>
              <strong>{filtered.length}</strong> đơn
            </span>

            <span>
              Doanh thu (đơn hoàn thành):{" "}
              <strong>{formatPrice(totalRevenue(filtered))}</strong>
            </span>
          </div>

          {filtered.length === 0 ? (
            <p className="sale-empty">
              Không có đơn hàng phù hợp với bộ lọc.
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Thời gian</th>
                    <th>Sản phẩm</th>
                    <th>Thanh toán</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((order) => {
                    const quantity = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    );

                    return (
                      <tr key={order.id}>
                        <td>
                          <Link
                            className="order-code"
                            to={`/orders/${order.id}`}
                          >
                            {order.code}
                          </Link>
                        </td>

                        <td>
                          <strong className="cell-strong">
                            {order.customerName || "Khách lẻ"}
                          </strong>

                          {order.customerPhone && (
                            <span className="cell-sub">
                              {order.customerPhone}
                            </span>
                          )}
                        </td>

                        <td>{formatDateTime(order.createdAt)}</td>

                        <td>
                          {order.items[0]?.productName}
                          {order.items.length > 1 &&
                            ` +${order.items.length - 1} sp khác`}
                          <span className="cell-sub">
                            {quantity} sản phẩm
                          </span>
                        </td>

                        <td>{PAYMENT_LABEL[order.paymentMethod]}</td>

                        <td>
                          <strong className="cell-strong">
                            {formatPrice(order.total)}
                          </strong>
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
          )}
        </section>
      )}
    </div>
  );
}