import { env } from '../config/env';

export interface SmsProvider {
  send(toPhone: string, message: string): Promise<void>;
}

// Development provider: prints the message instead of sending it.
class ConsoleSmsProvider implements SmsProvider {
  async send(toPhone: string, message: string) {
    console.log(`[SMS -> ${toPhone}] ${message}`);
  }
}

const PINDO_URL = 'https://api.pindo.io/v1/sms/';
const PINDO_TIMEOUT_MS = 10_000;

// Never put the full number or message (it contains the OTP) in errors or logs.
const mask = (phone: string) => `${phone.slice(0, 7)}***${phone.slice(-2)}`;

export function createPindoProvider(opts: {
  token: string;
  sender: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): SmsProvider {
  const doFetch = opts.fetchFn ?? fetch;
  return {
    async send(toPhone, message) {
      let res: Response;
      try {
        res = await doFetch(PINDO_URL, {
          method: 'POST',
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${opts.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: toPhone, text: message, sender: opts.sender }),
          signal: AbortSignal.timeout(opts.timeoutMs ?? PINDO_TIMEOUT_MS),
        });
      } catch (err) {
        const reason = err instanceof Error ? err.name : 'unknown';
        throw new Error(`Pindo request to ${mask(toPhone)} failed (${reason})`, { cause: err });
      }
      // Pindo answers 201 when the message is accepted; 401 = bad token, 409 = number/country/telco rejected.
      if (res.status !== 201) {
        let detail = '';
        try {
          detail = (await res.text()).slice(0, 200);
        } catch {
          // ignore body read errors
        }
        throw new Error(`Pindo rejected SMS to ${mask(toPhone)}: HTTP ${res.status} ${detail}`.trim());
      }
    },
  };
}

const ESMS_URL = 'https://sms.esmsafrica.io/api/messages/send';

/** eSMS Africa. A test key (esms_test_...) never reaches a phone: delivery is simulated and the text shows in the dashboard's test logs. */
export function createEsmsProvider(opts: {
  apiKey: string;
  sender?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): SmsProvider {
  const doFetch = opts.fetchFn ?? fetch;
  return {
    async send(toPhone, message) {
      let res: Response;
      try {
        res = await doFetch(ESMS_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toPhone, text: message, ...(opts.sender ? { sender_id: opts.sender } : {}) }),
          signal: AbortSignal.timeout(opts.timeoutMs ?? PINDO_TIMEOUT_MS),
        });
      } catch (err) {
        const reason = err instanceof Error ? err.name : 'unknown';
        throw new Error(`eSMS request to ${mask(toPhone)} failed (${reason})`, { cause: err });
      }
      // 200 = accepted (queued/submitted). Anything else (bad number, bad sender, no balance, bad key) is an HTTP error.
      if (res.status !== 200 && res.status !== 201 && res.status !== 202) {
        throw new Error(`eSMS rejected SMS to ${mask(toPhone)}: HTTP ${res.status}`);
      }
      const body = (await res.json().catch(() => null)) as { status?: string } | null;
      if (body?.status === 'failed') throw new Error(`eSMS failed to send SMS to ${mask(toPhone)}`);
    },
  };
}

function buildProvider(): SmsProvider {
  if (env.SMS_PROVIDER === 'esms') {
    // env.ts guarantees the key exists when SMS_PROVIDER=esms.
    return createEsmsProvider({ apiKey: env.ESMS_API_KEY!, sender: env.ESMS_SENDER_ID });
  }
  if (env.SMS_PROVIDER === 'pindo') {
    // env.ts guarantees both values exist when SMS_PROVIDER=pindo.
    if (env.PINDO_SENDER_ID === 'PindoTest' && env.NODE_ENV === 'production') {
      console.warn('PINDO_SENDER_ID is still "PindoTest". Register your own sender ID before real launch.');
    }
    return createPindoProvider({ token: env.PINDO_API_TOKEN!, sender: env.PINDO_SENDER_ID! });
  }
  if (env.NODE_ENV === 'production') {
    console.warn('SMS_PROVIDER=console in production: OTP codes are only printed, users will not receive them.');
  }
  return new ConsoleSmsProvider();
}

let provider: SmsProvider = buildProvider();

export const getSms = () => provider;
export const setSms = (p: SmsProvider) => {
  provider = p;
};
