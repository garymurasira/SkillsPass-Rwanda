import { describe, expect, it } from 'vitest';
import { totpAt, verifyTotp } from '../src/shared/totp';

describe('TOTP', () => {
  // RFC 6238 test vector: secret "12345678901234567890" (base32 below), T=59s -> 94287082 (last 6: 287082)
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  it('matches the RFC 6238 test vector', () => {
    expect(totpAt(rfcSecret, 59_000)).toBe('287082');
  });

  it('accepts adjacent steps but not distant ones', () => {
    const now = 1_700_000_000_000;
    const code = totpAt(rfcSecret, now);
    expect(verifyTotp(rfcSecret, code, now)).toBe(true);
    expect(verifyTotp(rfcSecret, code, now + 30_000)).toBe(true);
    expect(verifyTotp(rfcSecret, code, now + 120_000)).toBe(false);
    expect(verifyTotp(rfcSecret, 'abcdef', now)).toBe(false);
  });
});
