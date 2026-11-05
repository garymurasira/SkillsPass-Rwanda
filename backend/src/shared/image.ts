import sharp from 'sharp';
import { AppError } from './errors';

export const MAX_IMAGE_BYTES = 500 * 1024; // NFR 3

// Re-encodes to WebP, bakes in EXIF rotation and strips metadata (including GPS), then lowers
// quality and size until the result is under 500KB. Throws INVALID_IMAGE if the input isn't an image.
export async function compressImage(input: Buffer, maxDimension = 1280): Promise<Buffer> {
  let quality = 80;
  let dimension = maxDimension;

  for (let attempt = 0; attempt < 8; attempt++) {
    let out: Buffer;
    try {
      out = await sharp(input, { limitInputPixels: 50_000_000 })
        .rotate()
        .resize({ width: dimension, height: dimension, fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    } catch {
      throw new AppError(400, 'INVALID_IMAGE');
    }
    if (out.length <= MAX_IMAGE_BYTES) return out;

    if (quality > 50) quality -= 10;
    else dimension = Math.round(dimension * 0.8);
  }
  throw new AppError(422, 'IMAGE_TOO_COMPLEX');
}
