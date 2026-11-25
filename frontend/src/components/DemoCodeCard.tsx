import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * Demo mode only (the server returns the sign-in code instead of relying on an SMS, so the app can be tried without a phone).
 * Never rendered in normal use, because the server then never sends a code back.
 */
export function DemoCodeCard({ code, onUse, disabled }: { code: string; onUse: () => void; disabled?: boolean }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="space-y-2 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-center text-amber-950 dark:bg-amber-950 dark:text-amber-50">
      <p className="text-xs font-bold tracking-wide">{t("auth.demo.badge")}</p>
      <p className="text-base">
        {t("auth.demo.yourCode")} <span className="ml-1 font-mono text-2xl font-bold tracking-[0.3em]">{code}</span>
      </p>
      <Button type="button" variant="outline" className="h-11 w-full border-amber-400 bg-white font-bold text-amber-950 hover:bg-amber-100" disabled={disabled} onClick={onUse}>
        {t("auth.demo.use")}
      </Button>
    </div>
  );
}
