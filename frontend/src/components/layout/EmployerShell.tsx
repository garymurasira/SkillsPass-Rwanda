import { Link, Outlet } from "@tanstack/react-router";
import { Search, Heart, Briefcase, MessageCircle, Settings } from "lucide-react";
import { RequireRole } from "@/lib/auth";
import { useUnreadCount } from "@/lib/queries/messages";
import { BottomTabBar, TabBadge, useIsTabActive, type Tab } from "../BottomTabBar";
import { Logo } from "../Logo";

const tabs: Tab[] = [
  { to: "/employer", label: "Find", icon: Search, exact: true, extra: ["/employer/workers"] },
  { to: "/employer/favorites", label: "Favorites", icon: Heart },
  { to: "/employer/jobs", label: "Jobs", icon: Briefcase },
  { to: "/employer/messages", label: "Messages", icon: MessageCircle },
  { to: "/employer/settings", label: "Settings", icon: Settings },
];

export function EmployerShell() {
  const isActive = useIsTabActive();
  const unread = useUnreadCount();
  const shown = tabs.map((t) => (t.to === "/employer/messages" ? { ...t, badge: unread.data } : t));
  return (
    <RequireRole role="EMPLOYER">
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r bg-card p-4 md:flex">
        <div className="mb-6 px-2"><Logo /></div>
        {shown.map((t) => (
          <Link key={t.to} to={t.to as "/"} className={`flex h-12 items-center gap-3 rounded-xl px-3 font-bold ${isActive(t) ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted"}`}>
            <span className="relative"><t.icon className="h-5 w-5" /><TabBadge count={t.badge} /></span>{t.label}
          </Link>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col"><Outlet /></main>
        <BottomTabBar tabs={shown} className="md:hidden" />
      </div>
    </div>
    </RequireRole>
  );
}
