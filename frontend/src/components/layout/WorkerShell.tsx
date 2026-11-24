import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { UserRound, ShieldCheck, Briefcase, MessageCircle, Settings } from "lucide-react";
import { RequireRole } from "@/lib/auth";
import { useUnreadCount } from "@/lib/queries/messages";
import { BottomTabBar, type Tab } from "../BottomTabBar";

const tabsFor = (t: TFunction): Tab[] => [
  { to: "/worker", label: t("common.nav.profile"), icon: UserRound, exact: true, extra: ["/worker/profile", "/worker/skill", "/worker/ratings"] },
  { to: "/worker/verify", label: t("common.nav.verify"), icon: ShieldCheck },
  { to: "/worker/jobs", label: t("common.nav.jobs"), icon: Briefcase },
  { to: "/worker/messages", label: t("common.nav.messages"), icon: MessageCircle },
  { to: "/worker/settings", label: t("common.nav.settings"), icon: Settings },
];

export function WorkerShell() {
  const { t } = useTranslation();
  const unread = useUnreadCount();
  const shown = tabsFor(t).map((t) => (t.to === "/worker/messages" ? { ...t, badge: unread.data } : t));
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
