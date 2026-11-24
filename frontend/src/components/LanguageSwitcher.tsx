import { useTranslation } from "react-i18next";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { useAppLanguage } from "@/lib/i18n/hooks";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Controlled use (signed-in settings: the choice is saved on the account). Without these it changes the interface only. */
  value?: Language;
  onChange?: (lang: Language) => void;
  disabled?: boolean;
};

export function LanguageSwitcher({ className, value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const app = useAppLanguage();
  const lang = value ?? app.language;
  return (
    <div role="group" aria-label={t("common.language")} className={cn("inline-flex rounded-full border bg-card p-1", className)}>
      {LANGUAGES.map((l) => (
        <button key={l} type="button" disabled={disabled} aria-pressed={lang === l} onClick={() => (onChange ? onChange(l) : app.change(l))}
          className={cn("h-10 min-w-12 rounded-full px-3 text-sm font-bold disabled:opacity-60", lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
          {l}
        </button>
      ))}
    </div>
  );
}
