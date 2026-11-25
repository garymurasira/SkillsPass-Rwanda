import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, resetDb } from './helpers';
import { createAfricasTalkingProvider, createPindoProvider, getSms, setSms, type SmsProvider } from '../src/shared/sms';
import { prisma } from '../src/shared/prisma';

const opts = { token: 'secret-token', sender: 'PindoTest' };

describe('Pindo SMS provider', () => {
  it('posts to the single-SMS endpoint with bearer auth and the right body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{"status":"sent"}', { status: 201 }));
    await createPindoProvider({ ...opts, fetchFn }).send('+250781234567', 'Your code is 123456');

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.pindo.io/v1/sms/');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer secret-token');
    expect(JSON.parse(init.body)).toEqual({ to: '+250781234567', text: 'Your code is 123456', sender: 'PindoTest' });
  });

  it.each([401, 409, 500])('throws on HTTP %i without leaking the number, code or token', async (status) => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('bad', { status }));
    const err = await createPindoProvider({ ...opts, fetchFn })
      .send('+250781234567', 'Your code is 123456')
      .catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    const text = (err as Error).message;
    expect(text).toContain(String(status));
    expect(text).not.toContain('+250781234567');
    expect(text).not.toContain('123456');
    expect(text).not.toContain('secret-token');
  });

  it('throws on network failure without leaking details', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('fetch failed secret-token +250781234567'));
    const err = await createPindoProvider({ ...opts, fetchFn })
      .send('+250781234567', 'x')
      .catch((e: Error) => e);
    expect((err as Error).message).not.toContain('secret-token');
    expect((err as Error).message).not.toContain('+250781234567');
  });
});

describe("Africa's Talking SMS provider", () => {
  const at = { username: 'sandbox', apiKey: 'at-secret-key' };
  const ok = () => new Response(JSON.stringify({ SMSMessageData: { Recipients: [{ statusCode: 101, status: 'Success' }] } }), { status: 201 });

  it('posts a form to the sandbox endpoint with the api key header', async () => {
    const fetchFn = vi.fn().mockResolvedValue(ok());
    await createAfricasTalkingProvider({ ...at, fetchFn }).send('+250781234567', 'Your code is 123456');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.sandbox.africastalking.com/version1/messaging');
    expect(init.headers.apiKey).toBe('at-secret-key');
    const form = new URLSearchParams(init.body);
    expect(form.get('username')).toBe('sandbox');
    expect(form.get('to')).toBe('+250781234567');
    expect(form.get('message')).toBe('Your code is 123456');
  });

  it('uses the live endpoint for a real username', async () => {
    const fetchFn = vi.fn().mockResolvedValue(ok());
    await createAfricasTalkingProvider({ username: 'myapp', apiKey: 'k', fetchFn }).send('+250781234567', 'x');
    expect(fetchFn.mock.calls[0][0]).toBe('https://api.africastalking.com/version1/messaging');
  });

  it('throws when the recipient is rejected, without leaking the number, code or key', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ SMSMessageData: { Recipients: [{ statusCode: 403, status: 'InvalidPhoneNumber' }] } }), { status: 201 }),
    );
    const err = await createAfricasTalkingProvider({ ...at, fetchFn })
      .send('+250781234567', 'Your code is 123456')
      .catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    for (const secret of ['+250781234567', '123456', 'at-secret-key']) expect((err as Error).message).not.toContain(secret);
  });

  it('throws on HTTP errors and network failures', async () => {
    const bad = vi.fn().mockResolvedValue(new Response('no', { status: 401 }));
    await expect(createAfricasTalkingProvider({ ...at, fetchFn: bad }).send('+250781234567', 'x')).rejects.toThrow(/401/);
    const down = vi.fn().mockRejectedValue(new TypeError('fetch failed at-secret-key'));
    const err = await createAfricasTalkingProvider({ ...at, fetchFn: down }).send('+250781234567', 'x').catch((e: Error) => e);
    expect((err as Error).message).not.toContain('at-secret-key');
  });
});

describe('OTP when the SMS provider fails', () => {
  it('returns 502 SMS_SEND_FAILED, stores no code, and allows an immediate retry', async () => {
    await resetDb();
    const original: SmsProvider = getSms();
    setSms({ send: async () => Promise.reject(new Error('boom')) });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const body = { role: 'WORKER', phone: '0788123456', name: 'Jean Mugabo', region: 'Kigali', city: 'Gasabo' };

    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('SMS_SEND_FAILED');
    expect(await prisma.otpCode.count()).toBe(0);

    setSms(original);
    await request(app).post('/api/auth/register').send(body).expect(202);
    vi.restoreAllMocks();
  });
});
