import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { i18n } from "@/lib/i18n";
import { ChevronRight, LogOut, Phone, Languages } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { setLanguage } from "@/lib/api/worker";
import { errorMessage } from "@/lib/api/error-messages";
import { useAuth } from "@/lib/auth";
import { updateSessionUser } from "@/lib/auth/session";

export function SettingsCommon({ phoneTo, children }: { phoneTo: "/worker/settings/phone" | "/employer/settings/phone"; children?: ReactNode }) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const language = useMutation({
    mutationFn: setLanguage,
    onSuccess: (updated) => {
      updateSessionUser(updated);
      // Say it in the language they just chose: the screen switches a moment after this runs.
      toast.success(i18n.t("worker.settings.languageSaved", { lng: updated.language.toLowerCase() }));
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-4 p-4">
      {children}
      <div className="space-y-3 rounded-2xl border p-4">
        <p className="flex items-center gap-2 font-bold"><Languages className="h-5 w-5 text-primary" />{t("worker.settings.language")}</p>
        <LanguageSwitcher {...(user ? { value: user.language } : {})} onChange={(l) => language.mutate(l)} disabled={language.isPending} />
      </div>
      <Link to={phoneTo} className="flex h-16 items-center gap-3 rounded-2xl border px-4 font-bold">
        <Phone className="h-5 w-5 text-primary" /><span className="flex-1">{t("worker.settings.changePhone")}</span><ChevronRight className="h-5 w-5" />
      </Link>
      <button
        type="button"
        onClick={async () => { await signOut(); navigate({ to: "/", replace: true }); }}
        className="flex h-16 w-full items-center gap-3 rounded-2xl border border-destructive/40 px-4 font-bold text-destructive"
      >
        <LogOut className="h-5 w-5" />{t("worker.settings.logOut")}
      </button>
    </div>
  );
}
