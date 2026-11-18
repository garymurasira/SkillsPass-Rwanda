import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type Tab = { to: string; label: string; icon: LucideIcon; exact?: boolean; extra?: string[] };

export function useIsTabActive() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (t: Tab) => t.exact ? path === t.to || !!t.extra?.some((e) => path.startsWith(e)) : path.startsWith(t.to);
}

export function BottomTabBar({ tabs, className = "" }: { tabs: Tab[]; className?: string }) {
  const isActive = useIsTabActive();
  return (
    <nav className={`sticky bottom-0 z-30 grid border-t bg-background ${className}`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((t) => {
        const on = isActive(t);
        return (
          <Link key={t.to} to={t.to as "/"} className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold ${on ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`rounded-full px-4 py-1 ${on ? "bg-secondary" : ""}`}><t.icon className="h-6 w-6" /></span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
