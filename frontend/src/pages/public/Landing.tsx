import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HardHat, Building2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-5 py-6">
      <div className="flex items-center justify-between gap-2"><Logo /><LanguageSwitcher /></div>
      <div className="flex flex-1 flex-col justify-center gap-6 py-10">
        <h1 className="text-3xl font-bold leading-tight">{t("auth.landing.headline")}</h1>
        <p className="text-lg text-muted-foreground">{t("auth.landing.sub")}</p>
        <Link to="/register/worker" className="flex h-20 items-center gap-4 rounded-2xl bg-primary px-5 text-xl font-bold text-primary-foreground">
          <HardHat className="h-9 w-9 text-accent" /> {t("auth.landing.worker")}
        </Link>
        <Link to="/register/employer" className="flex h-20 items-center gap-4 rounded-2xl border-2 border-primary bg-card px-5 text-xl font-bold text-primary">
          <Building2 className="h-9 w-9" /> {t("auth.landing.employer")}
        </Link>
        <p className="text-center text-base">{t("auth.landing.alreadyRegistered")} <Link to="/login" className="font-bold text-primary underline underline-offset-4">{t("auth.landing.signIn")}</Link></p>
      </div>
      <Link to="/admin/login" className="py-3 text-center text-sm text-muted-foreground underline">{t("auth.landing.staff")}</Link>
    </div>
  );
}
