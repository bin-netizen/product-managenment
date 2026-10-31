import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import CancelOrderDialog from "../components/CancelOrderDialog";
import ProductThumb from "../components/ProductThumb";
import StatusBadge from "../components/StatusBadge";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import type { OrderInfoInput, PaymentMethod } from "../types/order";
import { formatPrice } from "../utils/format";
import {
  formatDateTime,
  getOrderHistory,
  PAYMENT_LABEL,
  STATUS_ACTION_LABEL,
  STATUS_FLOW,
  STATUS_LABEL,
  STATUS_TRANSITIONS,
} from "../utils/orders";

export default function OrderDetail() {
  const { id } = useParams();

  // key={id}: chuyển sang đơn khác thì reset form và thông báo
  return <OrderDetailView key={id} id={id} />;
}

function OrderDetailView({ id }: { id?: string }) {
  const { getOrderById, updateOrderStatus, updateOrderInfo } =
    useOrders();
  const { getProductById } = useProducts();

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OrderInfoInput>({
    customerName: "",
    customerPhone: "",
    note: "",
    paymentMethod: "cash",
  });

  const order = id ? getOrderById(id) : undefined;

  if (!order) {
    return (
      <div className="page">
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-icon">❌</div>

            <h3>Không tìm thấy đơn hàng</h3>

            <p>Đơn hàng này không tồn tại hoặc đã bị xóa.</p>

            <Link to="/orders" className="primary-button">
              ← Quay lại đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const transitions = STATUS_TRANSITIONS[order.status];
  const forwardSteps = transitions.filter(
    (status) => status !== "cancelled",
  );
  const canCancel = transitions.includes("cancelled");
  const history = getOrderHistory(order);
  const flowIndex = STATUS_FLOW.indexOf(order.status);

  const handleAdvance = (status: (typeof transitions)[number]) => {
    const result = updateOrderStatus(order.id, status);

    if (result.ok) {
      setError("");
      setNotice(`Đã chuyển đơn sang "${STATUS_LABEL[status]}".`);
    } else {
      setNotice("");
      setError(result.error);
    }
  };

  const handleCancelConfirm = (reason: string) => {
    const result = updateOrderStatus(order.id, "cancelled", {
      reason,
    });

    setShowCancel(false);

    if (result.ok) {
      setError("");
      setEditing(false);
      setNotice("Đã hủy đơn và hoàn hàng về kho.");
    } else {
      setNotice("");
      setError(result.error);
    }
  };

  const startEdit = () => {
    setForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: order.note,
      paymentMethod: order.paymentMethod,
    });
    setError("");
    setNotice("");
    setEditing(true);
  };

  const handleSaveInfo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = updateOrderInfo(order.id, form);

    if (result.ok) {
      setError("");
      setNotice("Đã cập nhật thông tin đơn hàng.");
      setEditing(false);
    } else {
      setNotice("");
      setError(result.error);
    }
  };

  return (
    <div className="page">
      <header className="page-header no-print">
        <div>
          <h2>Đơn hàng {order.code}</h2>

          <p>Chi tiết đơn bán, khách hàng và thanh toán</p>
        </div>

        <div className="detail-header-actions">
          <Link to="/orders" className="secondary-button">
            ← Danh sách
          </Link>

          <button
            type="button"
            className="secondary-button"
            onClick={() => window.print()}
          >
            🖨 In hóa đơn
          </button>
        </div>
      </header>

      {notice && (
        <div className="form-success no-print" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="form-error no-print" role="alert">
          {error}
        </div>
      )}

      {/* XỬ LÝ ĐƠN */}

      <section className="content-card order-process no-print">
        {isCancelled ? (
          <div className="order-cancel-banner">
            <strong>
              Đơn đã hủy
              {order.cancelledAt &&
                ` lúc ${formatDateTime(order.cancelledAt)}`}
            </strong>

            <p>
              Lý do: {order.cancelReason || "Không ghi lý do"}. Hàng đã
              được hoàn lại kho. Đơn đã hủy không thể mở lại hay chỉnh
              sửa.
            </p>
          </div>
        ) : (
          <>
            <ol className="order-steps" aria-label="Tiến trình đơn hàng">
              {STATUS_FLOW.map((status, index) => (
                <li
                  key={status}
                  className={
                    index < flowIndex
                      ? "order-step done"
                      : index === flowIndex
                        ? "order-step current"
                        : "order-step"
                  }
                  aria-current={
                    index === flowIndex ? "step" : undefined
                  }
                >
                  <span className="order-step-dot">
                    {index < flowIndex || order.status === "completed"
                      ? "✓"
                      : index + 1}
                  </span>

                  {STATUS_LABEL[status]}
                </li>
              ))}
            </ol>

            <div className="order-process-actions">
              {forwardSteps.map((status, index) => (
                <button
                  key={status}
                  type="button"
                  className={
                    index === 0 ? "primary-button" : "secondary-button"
                  }
                  onClick={() => handleAdvance(status)}
                >
                  {STATUS_ACTION_LABEL[status]}
                </button>
              ))}

              <button
                type="button"
                className="secondary-button"
                onClick={startEdit}
                disabled={editing}
              >
                ✏️ Sửa thông tin
              </button>

              {canCancel && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => setShowCancel(true)}
                >
                  Hủy đơn
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* SỬA THÔNG TIN */}

      {editing && (
        <form
          className="content-card order-edit no-print"
          onSubmit={handleSaveInfo}
        >
          <div className="detail-section-title">
            <span className="detail-section-icon">✏️</span>

            <div>
              <h3>Sửa thông tin đơn hàng</h3>

              <p>
                Chỉ sửa được thông tin khách và thanh toán. Muốn đổi
                sản phẩm, hãy hủy đơn rồi tạo đơn mới để kho luôn chính
                xác.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="edit-name">Tên khách hàng</label>

              <input
                id="edit-name"
                type="text"
                maxLength={100}
                value={form.customerName}
                onChange={(event) =>
                  setForm({ ...form, customerName: event.target.value })
                }
                placeholder="Để trống = Khách lẻ"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-phone">Số điện thoại</label>

              <input
                id="edit-phone"
                type="tel"
                inputMode="tel"
                value={form.customerPhone}
                onChange={(event) =>
                  setForm({ ...form, customerPhone: event.target.value })
                }
                placeholder="0901234567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-payment">Thanh toán</label>

              <select
                id="edit-payment"
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm({
                    ...form,
                    paymentMethod: event.target.value as PaymentMethod,
                  })
                }
              >
                {Object.entries(PAYMENT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full">
              <label htmlFor="edit-note">Ghi chú</label>

              <textarea
                id="edit-note"
                rows={3}
                maxLength={500}
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditing(false)}
            >
              Hủy chỉnh sửa
            </button>

            <button type="submit" className="primary-button">
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}

      {/* HÓA ĐƠN */}

      <section className="content-card invoice">
        <div className="invoice-head">
          <div>
            <span className="eyebrow">HÓA ĐƠN BÁN HÀNG</span>

            <h1>{order.code}</h1>

            <p>Tạo lúc {formatDateTime(order.createdAt)}</p>
          </div>

          <StatusBadge status={order.status} />
        </div>

        <div className="invoice-meta">
          <div>
            <span>Khách hàng</span>
            <strong>{order.customerName || "Khách lẻ"}</strong>
          </div>

          <div>
            <span>Số điện thoại</span>
            <strong>{order.customerPhone || "—"}</strong>
          </div>

          <div>
            <span>Thanh toán</span>
            <strong>{PAYMENT_LABEL[order.paymentMethod]}</strong>
          </div>

          <div>
            <span>
              {isCancelled
                ? "Đã hủy lúc"
                : order.completedAt
                  ? "Hoàn thành lúc"
                  : "Hoàn thành"}
            </span>
            <strong>
              {isCancelled && order.cancelledAt
                ? formatDateTime(order.cancelledAt)
                : order.completedAt
                  ? formatDateTime(order.completedAt)
                  : "Chưa hoàn thành"}
            </strong>
          </div>

          {isCancelled && (
            <div className="invoice-meta-wide">
              <span>Lý do hủy</span>
              <strong>{order.cancelReason || "Không ghi lý do"}</strong>
            </div>
          )}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>SL</th>
                <th>Thành tiền</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => {
                const product = getProductById(item.productId);

                const image =
                  product?.colors?.find(
                    (color) => color.id === item.colorId,
                  )?.image || product?.image;

                return (
                  <tr key={`${item.productId}:${item.colorId ?? ""}`}>
                    <td>
                      <div className="table-product">
                        <ProductThumb
                          src={image}
                          alt={item.productName}
                          size={42}
                        />

                        <div>
                          {product ? (
                            <Link
                              to={`/products/${product.id}`}
                              className="order-product-link"
                            >
                              <strong>{item.productName}</strong>
                            </Link>
                          ) : (
                            <strong>{item.productName}</strong>
                          )}

                          <span>
                            {item.colorName ?? "Mặc định"}
                            {!product && " · Sản phẩm đã bị xóa"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{formatPrice(item.unitPrice)}</td>
                    <td>{item.quantity}</td>

                    <td>
                      <strong className="cell-strong">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-bottom">
          <div className="invoice-note">
            {order.note && (
              <>
                <span>Ghi chú</span>
                <p>{order.note}</p>
              </>
            )}
          </div>

          <div className="sale-summary invoice-summary">
            <div>
              <span>Tạm tính</span>
              <strong>{formatPrice(order.subtotal)}</strong>
            </div>

            <div>
              <span>Giảm giá</span>
              <strong>- {formatPrice(order.discount)}</strong>
            </div>

            <div className="sale-total">
              <span>Tổng thanh toán</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* LỊCH SỬ */}

      <section className="content-card order-history no-print">
        <div className="detail-section-title">
          <span className="detail-section-icon">🕒</span>

          <div>
            <h3>Lịch sử đơn hàng</h3>

            <p>Các mốc xử lý theo thứ tự thời gian</p>
          </div>
        </div>

        <ol className="order-timeline">
          {history.map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <span
                className={`timeline-dot ${entry.status}`}
                aria-hidden="true"
              />

              <div>
                <strong>
                  {index === 0
                    ? `Tạo đơn (${STATUS_LABEL[entry.status]})`
                    : `Chuyển sang "${STATUS_LABEL[entry.status]}"`}
                </strong>

                <time dateTime={entry.at}>
                  {formatDateTime(entry.at)}
                </time>

                {entry.note && <p>Lý do: {entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {showCancel && (
        <CancelOrderDialog
          order={order}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancel(false)}
        />
      )}
    </div>
  );
}