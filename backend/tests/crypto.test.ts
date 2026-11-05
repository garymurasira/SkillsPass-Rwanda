import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, hashPhone, normalizePhone } from '../src/shared/crypto';

describe('crypto helpers', () => {
  it('round-trips encrypted data and uses a fresh IV each time', () => {
    const a = encrypt('+250788123456');
    expect(decrypt(a)).toBe('+250788123456');
    expect(encrypt('+250788123456')).not.toBe(a);
  });

  it('rejects tampered ciphertext', () => {
    const buf = Buffer.from(encrypt('secret'), 'base64');
    buf[buf.length - 1] ^= 1;
    expect(() => decrypt(buf.toString('base64'))).toThrow();
  });

  it('normalizes equivalent Rwanda phone formats to the same hash', () => {
    expect(normalizePhone('0788123456')).toBe('+250788123456');
    expect(hashPhone('0788 123 456')).toBe(hashPhone('+250788123456'));
    expect(hashPhone('250788123456')).toBe(hashPhone('+250788123456'));
  });
});
