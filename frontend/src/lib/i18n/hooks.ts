import { useTranslation } from "react-i18next";
import { applyLanguage, rememberLanguage, type Language } from "./index";

interface Named {
  nameEn: string;
  nameRw: string;
  nameFr: string;
}

/** The interface language and a way to change it (for visitors who are not signed in). */
export function useAppLanguage() {
  const { i18n } = useTranslation();
  const upper = i18n.language.toUpperCase();
  const language: Language = upper === "RW" || upper === "FR" ? upper : "EN";
  const change = (next: Language) => {
    rememberLanguage(next);
    applyLanguage(next);
  };
  return { language, change };
}

/** Picks the skill's name in the interface language. Re-renders when the language changes. */
export function useSkillName() {
  const { language } = useAppLanguage();
  return (skill: Named) => (language === "RW" ? skill.nameRw : language === "FR" ? skill.nameFr : skill.nameEn);
}
