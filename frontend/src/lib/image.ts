/**
 * Shrinks a photo in the browser before upload. Phone cameras produce 3-8 MB pictures, which is
 * slow and costly on mobile data, and the server shrinks them again anyway (NFR 3: under 500 KB).
 * Falls back to the original file if the browser can't decode it, and the server then decides.
 */
const MAX_SIDE = 1600;
const QUALITY = 0.82;

export async function prepareImage(file: File): Promise<Blob> {
  try {
    if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
