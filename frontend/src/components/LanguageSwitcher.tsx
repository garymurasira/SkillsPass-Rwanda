import { useState } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState("EN");
  return (
    <div role="group" aria-label="Language" className={cn("inline-flex rounded-full border bg-card p-1", className)}>
      {["RW", "EN", "FR"].map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)}
          className={cn("h-10 min-w-12 rounded-full px-3 text-sm font-bold", lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
          {l}
        </button>
      ))}
    </div>
  );
}
