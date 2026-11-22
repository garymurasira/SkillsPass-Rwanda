import { Outlet } from "@tanstack/react-router";
import { UserRound, ShieldCheck, Briefcase, MessageCircle, Settings } from "lucide-react";
import { RequireRole } from "@/lib/auth";
import { useUnreadCount } from "@/lib/queries/messages";
import { BottomTabBar, type Tab } from "../BottomTabBar";

const tabs: Tab[] = [
  { to: "/worker", label: "Profile", icon: UserRound, exact: true, extra: ["/worker/profile", "/worker/skill", "/worker/ratings"] },
  { to: "/worker/verify", label: "Verify", icon: ShieldCheck },
  { to: "/worker/jobs", label: "Jobs", icon: Briefcase },
  { to: "/worker/messages", label: "Messages", icon: MessageCircle },
  { to: "/worker/settings", label: "Settings", icon: Settings },
];

export function WorkerShell() {
  const unread = useUnreadCount();
  const shown = tabs.map((t) => (t.to === "/worker/messages" ? { ...t, badge: unread.data } : t));
  return (
    <RequireRole role="WORKER">
    <div className="min-h-screen bg-muted md:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-3xl md:border md:shadow-sm">
        <main className="flex flex-1 flex-col"><Outlet /></main>
        <BottomTabBar tabs={shown} />
      </div>
    </div>
    </RequireRole>
  );
}
