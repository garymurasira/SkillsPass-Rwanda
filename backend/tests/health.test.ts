import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createApp } from '../src/app';
import { UPLOAD_ROOT } from '../src/shared/storage';

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(createApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('uploaded photos', () => {
  it('can be shown by the web app, which runs on a different origin', async () => {
    const dir = path.join(UPLOAD_ROOT, 'profile');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'cors-check.webp'), 'not really an image');
    try {
      const res = await request(createApp()).get('/uploads/profile/cors-check.webp');
      expect(res.status).toBe(200);
      // Without this header browsers refuse to display the picture on another origin (Helmet's default is same-origin).
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } finally {
      await rm(path.join(dir, 'cors-check.webp'), { force: true });
    }
  });
});
