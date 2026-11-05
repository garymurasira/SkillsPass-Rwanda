import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
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

let storage: FileStorage = new LocalStorage();
export const getStorage = () => storage;
export const setStorage = (s: FileStorage) => {
  storage = s;
};
