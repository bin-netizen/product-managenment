import type { OrderStatus } from "../types/order";
import { STATUS_LABEL } from "../utils/orders";

export default function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  return (
    <span className={`status-badge ${status}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}