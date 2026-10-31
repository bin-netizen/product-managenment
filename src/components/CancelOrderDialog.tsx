import { useEffect, useRef, useState, type FormEvent } from "react";

import type { Order } from "../types/order";
import { CANCEL_REASONS, OTHER_CANCEL_REASON } from "../utils/orders";

interface CancelOrderDialogProps {
  order: Order;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

// Hộp thoại xác nhận hủy đơn: bắt buộc chọn lý do, nói rõ hậu quả (hoàn kho, trừ doanh thu)
export default function CancelOrderDialog({
  order,
  onConfirm,
  onClose,
}: CancelOrderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [choice, setChoice] = useState(CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const reason =
      choice === OTHER_CANCEL_REASON ? custom.trim() : choice;

    if (!reason) {
      setError("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    onConfirm(reason);
  };

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="cancel-dialog-title"
      onCancel={(event) => {
        // Nhấn Esc: để React đóng hộp thoại thay vì để trình duyệt tự đóng
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Bấm ra vùng nền tối bên ngoài thì đóng
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <form onSubmit={handleSubmit} className="confirm-dialog-body">
        <h3 id="cancel-dialog-title">Hủy đơn {order.code}?</h3>

        <p>
          Hàng trong đơn sẽ được hoàn lại kho.
          {order.status === "completed" &&
            " Đơn đã hoàn thành sẽ bị trừ khỏi doanh thu."}{" "}
          Thao tác này không thể hoàn tác.
        </p>

        <fieldset className="reason-list">
          <legend>Lý do hủy đơn</legend>

          {CANCEL_REASONS.map((reason) => (
            <label key={reason}>
              <input
                type="radio"
                name="cancel-reason"
                value={reason}
                checked={choice === reason}
                onChange={() => {
                  setChoice(reason);
                  setError("");
                }}
              />
              {reason}
            </label>
          ))}
        </fieldset>

        {choice === OTHER_CANCEL_REASON && (
          <textarea
            value={custom}
            maxLength={300}
            rows={3}
            placeholder="Nhập lý do cụ thể..."
            aria-label="Lý do hủy cụ thể"
            onChange={(event) => {
              setCustom(event.target.value);
              setError("");
            }}
          />
        )}

        {error && (
          <small className="field-error" role="alert">
            {error}
          </small>
        )}

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            autoFocus
          >
            Giữ đơn
          </button>

          <button type="submit" className="danger-button">
            Xác nhận hủy đơn
          </button>
        </div>
      </form>
    </dialog>
  );
}