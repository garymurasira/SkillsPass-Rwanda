import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, type Resources } from "./resources";

export const LANGUAGES = ["RW", "EN", "FR"] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = "skillspass.language";

const toCode = (l: Language) => l.toLowerCase() as "rw" | "en" | "fr";
const isLanguage = (v: unknown): v is Language => v === "RW" || v === "EN" || v === "FR";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: Resources };
    returnNull: false;
  }
}

// Every request starts in English, on the server and in the browser alike, so the first render
// matches. <LanguageSync /> switches to the person's language right after.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: resources.en }, rw: { translation: resources.rw }, fr: { translation: resources.fr } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React escapes already
  returnNull: false,
  initAsync: false,
});

/** The language the interface is showing right now. */
export function currentLanguage(): Language {
  const l = (i18n.language ?? "en").toUpperCase();
  return isLanguage(l) ? l : "EN";
}

/** Switches the interface. Does not save anything: see `rememberLanguage` and the Settings screen. */
export function applyLanguage(language: Language) {
  void i18n.changeLanguage(toCode(language));
  if (typeof document !== "undefined") document.documentElement.lang = toCode(language);
}

/** What a signed-out visitor picked last time (or what their browser speaks), if anything. */
export function storedLanguage(): Language | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(v)) return v;
  } catch {
    // blocked storage: fall through to the browser language
  }
  const browser = typeof navigator === "undefined" ? "" : navigator.language.slice(0, 2).toLowerCase();
  return browser === "rw" ? "RW" : browser === "fr" ? "FR" : null;
}

export function rememberLanguage(language: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // blocked storage: the choice just lasts until the page is closed
  }
}

/** The BCP 47 tag for Intl formatting (dates, numbers). */
export const intlLocale = (language: Language = currentLanguage()) => ({ RW: "rw", EN: "en-GB", FR: "fr-FR" })[language];

export { i18n };
