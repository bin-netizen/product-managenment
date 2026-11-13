import type { ProductMedia } from "../types/product";
import { getYouTubeId } from "../utils/media";

interface MediaPreviewProps {
  item: ProductMedia;
  alt?: string;
}

// Hiển thị đầy đủ: ảnh, video YouTube (iframe) hoặc video file (.mp4 / .webm)
export function MediaPreview({ item, alt }: MediaPreviewProps) {
  if (item.type === "image") {
    return <img src={item.url} alt={alt ?? "Ảnh sản phẩm"} />;
  }

  const youtubeId = getYouTubeId(item.url);

  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
        title={alt ?? "Video sản phẩm"}
        loading="lazy"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return <video src={item.url} controls preload="metadata" />;
}

// Ảnh thu nhỏ cho danh sách: video có thêm biểu tượng play
export function MediaThumb({ item, alt }: MediaPreviewProps) {
  if (item.type === "image") {
    return <img src={item.url} alt={alt ?? ""} loading="lazy" />;
  }

  const youtubeId = getYouTubeId(item.url);

  return (
    <>
      {youtubeId ? (
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={alt ?? ""}
          loading="lazy"
        />
      ) : (
        <video src={item.url} muted preload="metadata" aria-hidden="true" />
      )}

      <span className="gallery-play" aria-hidden="true">
        ▶
      </span>
    </>
  );
}