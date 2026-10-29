import { useStorageError } from "../utils/storage";

export default function StorageWarning() {
  const hasError = useStorageError();

  if (!hasError) {
    return null;
  }

  return (
    <div className="storage-warning no-print" role="alert">
      <strong>Bộ nhớ trình duyệt đã đầy.</strong> Thay đổi gần
      nhất chưa được lưu và sẽ mất khi tải lại trang. Hãy xóa
      bớt sản phẩm hoặc dùng ảnh nhỏ hơn.
    </div>
  );
}