import { BadgeCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { status: "verified" | "pending" | "unverified"; className?: string };

export function SkillBadge({ status, className }: Props) {
  if (status === "verified")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-success-surface px-2.5 py-1 text-sm font-bold text-success", className)}>
        <BadgeCheck className="h-4 w-4" /> Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-warning-surface px-2.5 py-1 text-sm font-bold text-accent-foreground", className)}>
        <Clock className="h-4 w-4" /> Pending
      </span>
    );
  return (
    <span className={cn("inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-sm text-muted-foreground", className)}>
      Not verified
    </span>
  );
}
