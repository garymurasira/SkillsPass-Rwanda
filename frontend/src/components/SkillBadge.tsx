import { BadgeCheck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = { status: "verified" | "pending" | "unverified"; className?: string };

export function SkillBadge({ status, className }: Props) {
  const { t } = useTranslation();
  if (status === "verified")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-success-surface px-2.5 py-1 text-sm font-bold text-success", className)}>
        <BadgeCheck className="h-4 w-4" /> {t("common.skillStatus.verified")}
      </span>
    );
  if (status === "pending")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-warning-surface px-2.5 py-1 text-sm font-bold text-accent-foreground", className)}>
        <Clock className="h-4 w-4" /> {t("common.skillStatus.pending")}
      </span>
    );
  return (
    <span className={cn("inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-sm text-muted-foreground", className)}>
      {t("common.skillStatus.notVerified")}
    </span>
  );
}
