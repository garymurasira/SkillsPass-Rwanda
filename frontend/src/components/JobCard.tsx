import type { ReactNode } from "react";
import { Briefcase } from "lucide-react";
import type { Job, JobStatus } from "@/mock/data";

const chip: Record<JobStatus, { label: string; cls: string }> = {
  in_progress: { label: "In progress", cls: "bg-secondary text-secondary-foreground" },
  employer_marked_done: { label: "Employer marked done", cls: "bg-warning-surface text-accent-foreground" },
  completed: { label: "Completed", cls: "bg-success-surface text-success" },
};

export function JobCard({ job, title, children }: { job: Job; title: string; children?: ReactNode }) {
  const c = chip[job.status];
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Briefcase className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">Started {job.createdAt}</p>
        </div>
      </div>
      <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${c.cls}`}>{c.label}</span>
      {children}
    </div>
  );
}
