import { Check, Circle, EyeOff, Eye } from "lucide-react";

type Props = { visible: boolean; checklist?: { label: string; done: boolean }[] };

export function StatusBanner({ visible, checklist = [] }: Props) {
  if (visible)
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-success bg-success-surface p-4 text-success">
        <Eye className="h-6 w-6 shrink-0" />
        <p className="font-bold">Employers can find you</p>
      </div>
    );
  return (
    <div className="rounded-2xl border-2 border-warning-border bg-warning-surface p-4">
      <div className="flex items-center gap-3 font-bold text-accent-foreground">
        <EyeOff className="h-6 w-6 shrink-0" /> Not visible to employers yet
      </div>
      <ul className="mt-3 space-y-2">
        {checklist.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            {c.done ? <Check className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
