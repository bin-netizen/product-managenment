import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import ProductThumb from "../components/ProductThumb";
import StatusBadge from "../components/StatusBadge";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { formatPrice } from "../utils/format";
import {
  formatDateTime,
  PAYMENT_LABEL,
  STATUS_TRANSITIONS,
} from "../utils/orders";

export default function OrderDetail() {
  const { id } = useParams();

  const { getOrderById, updateOrderStatus } = useOrders();
  const { getProductById } = useProducts();

  const [error, setError] = useState("");

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

  const canComplete =
    STATUS_TRANSITIONS[order.status].includes("completed");
  const canCancel =
    STATUS_TRANSITIONS[order.status].includes("cancelled");

  const handleComplete = () => {
    const result = updateOrderStatus(order.id, "completed");

    setError(result.ok ? "" : result.error);
  };

  const handleCancel = () => {
    const confirmed = window.confirm(
      order.status === "completed"
        ? `Hủy đơn ${order.code}? Đơn đã hoàn thành sẽ bị trừ khỏi doanh thu và hàng được hoàn lại kho. Thao tác này không thể hoàn tác.`
        : `Hủy đơn ${order.code}? Hàng sẽ được hoàn lại kho. Thao tác này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    const result = updateOrderStatus(order.id, "cancelled");

    setError(result.ok ? "" : result.error);
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

          {canComplete && (
            <button
              type="button"
              className="primary-button"
              onClick={handleComplete}
            >
              ✓ Hoàn thành đơn
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              className="danger-button"
              onClick={handleCancel}
            >
              Hủy đơn
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="form-error no-print" role="alert">
          {error}
        </div>
      )}

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
              {order.status === "cancelled"
                ? "Đã hủy lúc"
                : order.completedAt
                  ? "Hoàn thành lúc"
                  : "Hoàn thành"}
            </span>
            <strong>
              {order.status === "cancelled" && order.cancelledAt
                ? formatDateTime(order.cancelledAt)
                : order.completedAt
                  ? formatDateTime(order.completedAt)
                  : "Chưa hoàn thành"}
            </strong>
          </div>
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
                          <strong>{item.productName}</strong>

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
    </div>
  );
}