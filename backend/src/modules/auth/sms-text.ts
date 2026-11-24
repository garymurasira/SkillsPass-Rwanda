import type { Language } from '@prisma/client';

// The text of the sign-in code SMS, in the language saved on the person's account.
// Plain letters only (no accents), so every handset shows it correctly and it stays in one SMS segment.
const TEMPLATES: Record<Language, (code: string, minutes: number) => string> = {
  EN: (code, minutes) => `Your SkillsPass code is ${code}. It expires in ${minutes} minutes.`,
  RW: (code, minutes) => `Kode yawe ya SkillsPass ni ${code}. Izarangira nyuma y'iminota ${minutes}.`,
  FR: (code, minutes) => `Votre code SkillsPass est ${code}. Il expire dans ${minutes} minutes.`,
};

export const otpMessage = (language: Language, code: string, minutes: number) => TEMPLATES[language](code, minutes);
