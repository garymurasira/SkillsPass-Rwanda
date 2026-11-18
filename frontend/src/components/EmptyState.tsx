import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-10 w-10" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {text && <p className="max-w-xs text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}
