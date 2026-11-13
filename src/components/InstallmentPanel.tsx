import { useState, type FormEvent } from "react";

import { useOrders } from "../context/OrderContext";
import type { Order } from "../types/order";
import {
  formatInputPrice,
  formatPrice,
  parsePrice,
} from "../utils/format";
import {
  calcMonthlyPayment,
  formatDateTime,
  installmentPaid,
  installmentRemaining,
} from "../utils/orders";

// Khung theo dõi trả góp: tổng quan, các khoản khách đã trả, ghi nhận khoản thu mới
export default function InstallmentPanel({ order }: { order: Order }) {
  const { addInstallmentPayment, removeInstallmentPayment } =
    useOrders();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const plan = order.installment;

  if (!plan) {
    return null;
  }

  const paid = installmentPaid(order);
  const remaining = installmentRemaining(order);
  const monthly = calcMonthlyPayment(
    order.total,
    plan.downPayment,
    plan.months,
  );
  const percent =
    order.total > 0
      ? Math.min(100, Math.round((paid / order.total) * 100))
      : 0;

  const isCancelled = order.status === "cancelled";
  const editable = !isCancelled && order.status !== "completed";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = addInstallmentPayment(order.id, {
      amount: parsePrice(amount),
      note,
    });

    if (result.ok) {
      setAmount("");
      setNote("");
      setError("");
      setNotice("Đã ghi nhận khoản thu.");
    } else {
      setNotice("");
      setError(result.error);
    }
  };

  const handleRemove = (paymentId: string, value: number) => {
    if (
      !window.confirm(
        `Xóa khoản thu ${formatPrice(value)}? Chỉ xóa khi ghi nhầm.`,
      )
    ) {
      return;
    }

    const result = removeInstallmentPayment(order.id, paymentId);

    if (result.ok) {
      setError("");
      setNotice("Đã xóa khoản thu.");
    } else {
      setNotice("");
      setError(result.error);
    }
  };

  return (
    <section className="content-card installment-panel no-print">
      <div className="detail-section-title">
        <span className="detail-section-icon">💳</span>

        <div>
          <h3>Trả góp</h3>

          <p>
            {plan.months} tháng, không tính lãi. Khi khách trả đủ, bấm
            "Hoàn thành đơn" ở mục Xử lý đơn.
          </p>
        </div>
      </div>

      <div className="installment-stats">
        <div>
          <span>Tổng đơn</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>

        <div>
          <span>Trả trước</span>
          <strong>{formatPrice(plan.downPayment)}</strong>
        </div>

        <div>
          <span>Dự kiến góp mỗi tháng</span>
          <strong>{formatPrice(monthly)}</strong>
        </div>

        <div>
          <span>Đã thu</span>
          <strong>{formatPrice(paid)}</strong>
        </div>

        <div>
          <span>Còn phải thu</span>
          <strong>{formatPrice(remaining)}</strong>
        </div>
      </div>

      <div className="installment-progress">
        <progress
          max={order.total}
          value={paid}
          aria-label={`Đã thu ${percent}%`}
        />

        <span>{percent}%</span>
      </div>

      {notice && (
        <div className="form-success" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {isCancelled && paid > 0 && (
        <div className="order-cancel-banner">
          Đơn đã hủy. Khách đã trả {formatPrice(paid)}, hệ thống không
          tự hoàn tiền nên bạn cần hoàn lại cho khách.
        </div>
      )}

      {editable && remaining === 0 && (
        <div className="form-success" role="status">
          Khách đã trả đủ. Bạn có thể hoàn thành đơn.
        </div>
      )}

      <h4 className="spec-group-title">Các khoản khách đã trả</h4>

      {plan.payments.length === 0 ? (
        <p className="sale-empty">Chưa ghi nhận khoản thu nào.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Số tiền</th>
                <th>Ghi chú</th>
                {editable && <th aria-label="Thao tác" />}
              </tr>
            </thead>

            <tbody>
              {plan.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDateTime(payment.paidAt)}</td>

                  <td>
                    <strong className="cell-strong">
                      {formatPrice(payment.amount)}
                    </strong>
                  </td>

                  <td>{payment.note || "—"}</td>

                  {editable && (
                    <td>
                      <button
                        type="button"
                        className="danger-button small"
                        onClick={() =>
                          handleRemove(payment.id, payment.amount)
                        }
                      >
                        Xóa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editable && remaining > 0 && (
        <form className="installment-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="payment-amount">Số tiền khách trả (đ)</label>

              <input
                id="payment-amount"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(event) =>
                  setAmount(formatInputPrice(event.target.value))
                }
              />

              <div className="installment-quick">
                <button
                  type="button"
                  className="secondary-button small"
                  onClick={() =>
                    setAmount(
                      formatInputPrice(
                        String(Math.min(monthly, remaining)),
                      ),
                    )
                  }
                >
                  Một kỳ ({formatPrice(Math.min(monthly, remaining))})
                </button>

                <button
                  type="button"
                  className="secondary-button small"
                  onClick={() =>
                    setAmount(formatInputPrice(String(remaining)))
                  }
                >
                  Trả hết ({formatPrice(remaining)})
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="payment-note">Ghi chú</label>

              <input
                id="payment-note"
                maxLength={200}
                placeholder="Ví dụ: Kỳ 1, chuyển khoản"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              + Ghi nhận khoản thu
            </button>
          </div>
        </form>
      )}
    </section>
  );
}