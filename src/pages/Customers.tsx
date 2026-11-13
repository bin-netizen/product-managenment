import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useOrders } from "../context/OrderContext";
import { buildCustomers, foldText } from "../utils/customers";
import { formatPrice } from "../utils/format";
import { formatDateTime } from "../utils/orders";

type Filter = "all" | "debt";
type SortKey = "recent" | "spent" | "debt" | "name";

export default function Customers() {
  const { orders } = useOrders();

  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");

  const { customers, withoutPhone } = useMemo(
    () => buildCustomers(orders),
    [orders],
  );

  const stats = useMemo(() => {
    const debtors = customers.filter((c) => c.outstanding > 0);

    return {
      debtorCount: debtors.length,
      totalDebt: debtors.reduce((sum, c) => sum + c.outstanding, 0),
      loyalCount: customers.filter((c) => c.orderCount >= 2).length,
    };
  }, [customers]);

  const visible = useMemo(() => {
    const keyword = foldText(search.trim());
    const phoneKeyword = keyword.replace(/[\s.]/g, "");

    const list = customers.filter((customer) => {
      if (filter === "debt" && customer.outstanding <= 0) return false;
      if (!keyword) return true;

      return (
        foldText(customer.code).includes(keyword) ||
        foldText(customer.name).includes(keyword) ||
        (phoneKeyword !== "" && customer.phone.includes(phoneKeyword))
      );
    });

    return list.sort((a, b) => {
      if (sort === "spent") return b.totalSpent - a.totalSpent;
      if (sort === "debt") return b.outstanding - a.outstanding;
      if (sort === "name") return a.name.localeCompare(b.name, "vi");

      return b.lastOrderAt.localeCompare(a.lastOrderAt);
    });
  }, [customers, filter, sort, search]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>Khách hàng</h1>

          <p>
            Tự động gom từ các đơn hàng theo số điện thoại. Khách mua lần
            nào cũng nhập cùng số thì sẽ nằm chung một hồ sơ.
          </p>
        </div>

        <Link to="/orders/new" className="primary-button">
          + Tạo đơn bán
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="empty-state large">
          <div className="empty-icon">👥</div>

          <h3>Chưa có khách hàng nào</h3>

          <p>
            Khách hàng sẽ xuất hiện khi bạn tạo đơn có nhập số điện
            thoại.
          </p>

          <Link to="/orders/new" className="primary-button">
            + Tạo đơn bán
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>

              <div>
                <span>Tổng số khách</span>
                <strong>{customers.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">↻</div>

              <div>
                <span>Khách quen (từ 2 đơn)</span>
                <strong>{stats.loyalCount}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">⏱</div>

              <div>
                <span>Khách còn nợ</span>
                <strong>{stats.debtorCount}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">₫</div>

              <div>
                <span>Tổng còn phải thu</span>
                <strong>{formatPrice(stats.totalDebt)}</strong>
              </div>
            </div>
          </div>

          <section className="content-card">
            <div className="orders-toolbar">
              <div className="tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                  className={filter === "all" ? "tab active" : "tab"}
                  onClick={() => setFilter("all")}
                >
                  Tất cả
                  <span>{customers.length}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "debt"}
                  className={filter === "debt" ? "tab active" : "tab"}
                  onClick={() => setFilter("debt")}
                >
                  Còn nợ trả góp
                  <span>{stats.debtorCount}</span>
                </button>
              </div>

              <div className="orders-filters">
                <input
                  type="search"
                  placeholder="Tìm mã, tên hoặc số điện thoại..."
                  aria-label="Tìm khách hàng"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  value={sort}
                  aria-label="Sắp xếp"
                  onChange={(event) =>
                    setSort(event.target.value as SortKey)
                  }
                >
                  <option value="recent">Mua gần nhất</option>
                  <option value="spent">Đã mua nhiều nhất</option>
                  <option value="debt">Nợ nhiều nhất</option>
                  <option value="name">Tên A → Z</option>
                </select>
              </div>
            </div>

            <div className="orders-summary">
              <span>
                <strong>{visible.length}</strong> khách
              </span>

              {withoutPhone > 0 && (
                <span>
                  {withoutPhone} đơn không có số điện thoại nên không
                  gom vào khách nào
                </span>
              )}
            </div>

            {visible.length === 0 ? (
              <p className="sale-empty">
                Không có khách hàng phù hợp với bộ lọc.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã KH</th>
                      <th>Khách hàng</th>
                      <th>Số đơn</th>
                      <th>Đã mua (đơn hoàn thành)</th>
                      <th>Còn nợ</th>
                      <th>Mua gần nhất</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visible.map((customer) => (
                      <tr key={customer.key}>
                        <td>
                          <span className="customer-code">
                            {customer.code || "—"}
                          </span>
                        </td>

                        <td>
                          <div className="customer-cell">
                            <span
                              className="customer-avatar"
                              aria-hidden="true"
                            >
                              {customer.name.charAt(0).toUpperCase()}
                            </span>

                            <div>
                              <strong>{customer.name}</strong>
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {customer.orderCount}
                          {customer.cancelledCount > 0 && (
                            <span className="cell-sub">
                              {customer.cancelledCount} đơn hủy
                            </span>
                          )}
                        </td>

                        <td>
                          <strong className="cell-strong">
                            {formatPrice(customer.totalSpent)}
                          </strong>
                        </td>

                        <td>
                          {customer.outstanding > 0 ? (
                            <strong className="debt-text">
                              {formatPrice(customer.outstanding)}
                            </strong>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>{formatDateTime(customer.lastOrderAt)}</td>

                        <td>
                          <Link
                            className="secondary-button small"
                            to={`/customers/${customer.code || customer.key}`}
                          >
                            Xem
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}