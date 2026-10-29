interface ProductThumbProps {
  src?: string;
  alt: string;
  size?: number;
}

// Ảnh sản phẩm có khung dự phòng khi chưa có ảnh (hoặc sản phẩm đã bị xóa)
export default function ProductThumb({
  src,
  alt,
  size = 48,
}: ProductThumbProps) {
  return (
    <div
      className="thumb"
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt={alt} /> : <span>📦</span>}
    </div>
  );
}