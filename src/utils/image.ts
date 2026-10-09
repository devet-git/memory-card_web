import { AIImage } from "utils/ai";

export const MAX_SIDE = 1280;
export const JPEG_QUALITY = 0.82;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** Scales (width, height) down so the longer side is at most `max`, keeping the aspect ratio. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG khác."));
    img.src = url;
  });

/** Shrinks a photo to a JPEG small enough to send to an AI provider, and returns it with a preview URL. */
export async function fileToAIImage(file: File): Promise<AIImage & { preview: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Đây không phải tệp ảnh.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Ảnh quá lớn (tối đa 15 MB).");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không xử lý được ảnh.");
    ctx.fillStyle = "#ffffff"; // transparent PNGs would turn black as JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return { mediaType: "image/jpeg", data: dataUrl.slice(dataUrl.indexOf(",") + 1), preview: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}
