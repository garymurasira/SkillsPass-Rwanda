import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';

// Files live behind this interface so local disk (dev) can be swapped for S3-compatible storage later.
export interface FileStorage {
  /** Saves bytes and returns the public URL path. */
  save(data: Buffer, folder: string, ext: string): Promise<string>;
  remove(url: string): Promise<void>;
}

export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);
export const UPLOAD_URL_PREFIX = '/uploads';

class LocalStorage implements FileStorage {
  async save(data: Buffer, folder: string, ext: string) {
    const name = `${randomUUID()}.${ext}`; // never trust client-supplied names
    const dir = path.join(UPLOAD_ROOT, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), data);
    return `${UPLOAD_URL_PREFIX}/${folder}/${name}`;
  }

  async remove(url: string) {
    if (!url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return;
    const target = path.resolve(UPLOAD_ROOT, url.slice(UPLOAD_URL_PREFIX.length + 1));
    if (!target.startsWith(UPLOAD_ROOT + path.sep)) return; // path traversal guard
    await unlink(target).catch(() => undefined);
  }
}

const CONTENT_TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

/** Any S3-compatible bucket. Returns absolute public URLs, which the web app shows as they are. */
class S3Storage implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
    });
    this.bucket = env.S3_BUCKET!;
    this.publicUrl = env.S3_PUBLIC_URL!.replace(/\/+$/, '');
  }

  async save(data: Buffer, folder: string, ext: string) {
    const key = `${folder}/${randomUUID()}.${ext}`; // never trust client-supplied names
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
        CacheControl: 'public, max-age=604800',
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async remove(url: string) {
    if (!url.startsWith(`${this.publicUrl}/`)) return;
    const key = url.slice(this.publicUrl.length + 1);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch(() => undefined);
  }
}

let storage: FileStorage = env.STORAGE_DRIVER === 's3' ? new S3Storage() : new LocalStorage();
export const getStorage = () => storage;
export const setStorage = (s: FileStorage) => {
  storage = s;
};
