import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export type Tab = { to: string; label: string; icon: LucideIcon; exact?: boolean; extra?: string[]; /** A number shown on the icon, e.g. unread messages. Hidden at 0. */ badge?: number | undefined };

export function useIsTabActive() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (t: Tab) => t.exact ? path === t.to || !!t.extra?.some((e) => path.startsWith(e)) : path.startsWith(t.to);
}

/** The little number on a tab, e.g. unread messages. */
export function TabBadge({ count }: { count: number | undefined }) {
  const { t } = useTranslation();
  if (!count) return null;
  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-destructive-foreground" aria-label={t("common.unread", { count })}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function BottomTabBar({ tabs, className = "" }: { tabs: Tab[]; className?: string }) {
  const isActive = useIsTabActive();
  return (
    <nav className={`sticky bottom-0 z-30 grid border-t bg-background ${className}`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => {
        const on = isActive(t);
        return (
          <Link key={t.to} to={t.to as "/"} className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold ${on ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`relative rounded-full px-4 py-1 ${on ? "bg-secondary" : ""}`}>
              <t.icon className="h-6 w-6" />
              <TabBadge count={t.badge} />
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
