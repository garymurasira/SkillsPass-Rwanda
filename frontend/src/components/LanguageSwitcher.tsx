import { useState } from "react";
import { cn } from "@/lib/utils";

type Lang = "RW" | "EN" | "FR";

type Props = {
  className?: string;
  /** Controlled use (signed-in settings). Without these the switcher is only a visual control. */
  value?: Lang;
  onChange?: (lang: Lang) => void;
  disabled?: boolean;
};

export function LanguageSwitcher({ className, value, onChange, disabled }: Props) {
  const [inner, setInner] = useState<Lang>("EN");
  const lang = value ?? inner;
  return (
    <div role="group" aria-label="Language" className={cn("inline-flex rounded-full border bg-card p-1", className)}>
      {(["RW", "EN", "FR"] as const).map((l) => (
        <button key={l} type="button" disabled={disabled} aria-pressed={lang === l} onClick={() => (onChange ? onChange(l) : setInner(l))}
          className={cn("h-10 min-w-12 rounded-full px-3 text-sm font-bold disabled:opacity-60", lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
          {l}
        </button>
      ))}
    </div>
  );
}
