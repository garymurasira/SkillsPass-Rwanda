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

const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging';
const AT_LIVE_URL = 'https://api.africastalking.com/version1/messaging';

/** Africa's Talking. With the username "sandbox" nothing reaches a phone: the text appears in the dashboard simulator. */
export function createAfricasTalkingProvider(opts: {
  username: string;
  apiKey: string;
  sender?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): SmsProvider {
  const doFetch = opts.fetchFn ?? fetch;
  const url = opts.username === 'sandbox' ? AT_SANDBOX_URL : AT_LIVE_URL;
  return {
    async send(toPhone, message) {
      const form = new URLSearchParams({ username: opts.username, to: toPhone, message });
      if (opts.sender) form.set('from', opts.sender);
      let res: Response;
      try {
        res = await doFetch(url, {
          method: 'POST',
          headers: { Accept: 'application/json', apiKey: opts.apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
          signal: AbortSignal.timeout(opts.timeoutMs ?? PINDO_TIMEOUT_MS),
        });
      } catch (err) {
        const reason = err instanceof Error ? err.name : 'unknown';
        throw new Error(`Africa's Talking request to ${mask(toPhone)} failed (${reason})`, { cause: err });
      }
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Africa's Talking rejected SMS to ${mask(toPhone)}: HTTP ${res.status}`);
      }
      // 200/201 only means the request was understood. Each recipient has its own status (100-102 = accepted).
      const body = (await res.json().catch(() => null)) as { SMSMessageData?: { Recipients?: { statusCode?: number }[] } } | null;
      const recipient = body?.SMSMessageData?.Recipients?.[0];
      if (!recipient || ![100, 101, 102].includes(Number(recipient.statusCode))) {
        throw new Error(`Africa's Talking did not accept SMS to ${mask(toPhone)} (status ${recipient?.statusCode ?? 'none'})`);
      }
    },
  };
}

function buildProvider(): SmsProvider {
  if (env.SMS_PROVIDER === 'africastalking') {
    // env.ts guarantees both values exist when SMS_PROVIDER=africastalking.
    return createAfricasTalkingProvider({ username: env.AT_USERNAME!, apiKey: env.AT_API_KEY!, sender: env.AT_SENDER_ID });
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
