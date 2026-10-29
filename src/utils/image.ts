// Đọc ảnh và nén về tối đa maxSize px trước khi lưu (PNG/WebP -> WebP để giữ nền trong suốt, còn lại -> JPEG).
// Ảnh gốc từ điện thoại có thể vài MB, mà localStorage chỉ có khoảng 5MB cho cả hệ thống.
export function fileToCompressedDataUrl(
  file: File,
  maxSize = 900,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error);

    reader.onload = () => {
      const original = String(reader.result);

      // SVG/GIF giữ nguyên để không mất nét hoặc hoạt ảnh
      if (
        file.type === "image/svg+xml" ||
        file.type === "image/gif"
      ) {
        resolve(original);
        return;
      }

      const image = new Image();

      image.onerror = () => resolve(original);

      image.onload = () => {
        const ratio = Math.min(
          1,
          maxSize / Math.max(image.width, image.height),
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const context = canvas.getContext("2d");

        if (!context) {
          resolve(original);
          return;
        }

        const keepAlpha =
          file.type === "image/png" || file.type === "image/webp";

        // JPEG không có kênh trong suốt nên cần tô nền trắng, nếu không vùng trong suốt sẽ thành màu đen
        if (!keepAlpha) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL(
          keepAlpha ? "image/webp" : "image/jpeg",
          quality,
        );

        resolve(
          compressed.length < original.length
            ? compressed
            : original,
        );
      };

      image.src = original;
    };

    reader.readAsDataURL(file);
  });
}