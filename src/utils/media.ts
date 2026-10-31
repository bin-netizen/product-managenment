// Lấy ID video từ link YouTube (watch, shorts, embed, youtu.be). Không phải YouTube thì trả về null.
export function getYouTubeId(url: string): string | null {
  return (
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
    )?.[1] ?? null
  );
}