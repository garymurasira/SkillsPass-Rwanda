export interface SmsProvider {
  send(toPhone: string, message: string): Promise<void>;
}

// Development provider: prints the message instead of sending it. Swap for a real gateway later.
class ConsoleSmsProvider implements SmsProvider {
  async send(toPhone: string, message: string) {
    console.log(`[SMS -> ${toPhone}] ${message}`);
  }
}

let provider: SmsProvider = new ConsoleSmsProvider();

export const getSms = () => provider;
export const setSms = (p: SmsProvider) => {
  provider = p;
};
