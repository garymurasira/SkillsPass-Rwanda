import { afterEach, describe, expect, it } from "vitest";
import { applyLanguage, currentLanguage, i18n, intlLocale, rememberLanguage, storedLanguage } from "./index";
import { resources } from "./resources";

type Tree = { [key: string]: string | Tree };

/** Every leaf as "section.key.path" -> text. */
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    if (typeof v === "string") out[prefix + k] = v;
    else Object.assign(out, flatten(v, `${prefix}${k}.`));
  }
  return out;
}

const placeholders = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();
const tags = (text: string) => [...text.matchAll(/<\/?(\w+)\s*\/?>/g)].map((m) => m[1]).sort();

const en = flatten(resources.en);

afterEach(() => applyLanguage("EN"));

describe("translations", () => {
  for (const lang of ["rw", "fr"] as const) {
    describe(lang, () => {
      const other = flatten(resources[lang]);

      it("has exactly the same keys as English", () => {
        expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
      });

      it("has no empty text", () => {
        expect(Object.entries(other).filter(([, v]) => v.trim() === "")).toEqual([]);
      });

      it("keeps every {{placeholder}} and <tag> of the English text", () => {
        const broken = Object.keys(en).filter(
          (k) => placeholders(other[k] ?? "").join() !== placeholders(en[k] ?? "").join() || tags(other[k] ?? "").join() !== tags(en[k] ?? "").join(),
        );
        expect(broken).toEqual([]);
      });
    });
  }
});

describe("switching language", () => {
  it("starts in English", () => {
    expect(currentLanguage()).toBe("EN");
    expect(i18n.t("auth.login.title")).toBe("Sign in");
  });

  it("changes the text, and falls back to English for anything missing", () => {
    applyLanguage("RW");
    expect(currentLanguage()).toBe("RW");
    expect(i18n.t("auth.login.title")).toBe("Injira");
    applyLanguage("FR");
    expect(i18n.t("auth.login.title")).toBe("Se connecter");
  });

  it("fills in values and plural forms", () => {
    expect(i18n.t("common.years", { count: 1 })).toBe("1 year");
    expect(i18n.t("common.years", { count: 5 })).toBe("5 years");
    applyLanguage("FR");
    expect(i18n.t("common.years", { count: 5 })).toBe("5 ans");
    expect(i18n.t("auth.otp.resendIn", { seconds: 42 })).toBe("Renvoyer le code dans 42 s");
  });

  it("sets the page language and the date locale", () => {
    applyLanguage("FR");
    expect(document.documentElement.lang).toBe("fr");
    expect(intlLocale()).toBe("fr-FR");
    applyLanguage("RW");
    expect(intlLocale()).toBe("rw");
  });
});

describe("remembered language", () => {
  afterEach(() => window.localStorage.clear());

  it("comes back after a reload", () => {
    rememberLanguage("RW");
    expect(storedLanguage()).toBe("RW");
  });

  it("ignores junk in storage", () => {
    window.localStorage.setItem("skillspass.language", "XX");
    expect(storedLanguage()).not.toBe("XX");
  });
});
