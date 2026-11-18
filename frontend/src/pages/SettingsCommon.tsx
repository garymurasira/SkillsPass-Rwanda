import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, LogOut, Phone, Languages } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SettingsCommon({ phoneTo, children }: { phoneTo: "/worker/settings/phone" | "/employer/settings/phone"; children?: ReactNode }) {
  return (
    <div className="space-y-4 p-4">
      {children}
      <div className="space-y-3 rounded-2xl border p-4">
        <p className="flex items-center gap-2 font-bold"><Languages className="h-5 w-5 text-primary" />Language</p>
        <LanguageSwitcher />
      </div>
      <Link to={phoneTo} className="flex h-16 items-center gap-3 rounded-2xl border px-4 font-bold">
        <Phone className="h-5 w-5 text-primary" /><span className="flex-1">Change phone number</span><ChevronRight className="h-5 w-5" />
      </Link>
      <Link to="/" className="flex h-16 items-center gap-3 rounded-2xl border border-destructive/40 px-4 font-bold text-destructive">
        <LogOut className="h-5 w-5" />Log out
      </Link>
    </div>
  );
}
