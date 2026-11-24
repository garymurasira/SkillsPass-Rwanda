import type { ReactNode } from "react";
import { Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Job, JobStatus } from "@/lib/api/jobs";
import { formatDate } from "@/lib/format";
import { StarRating } from "./StarRating";

const chip = {
  IN_PROGRESS: { label: "common.jobStatus.inProgress" as const, cls: "bg-secondary text-secondary-foreground" },
  EMPLOYER_MARKED: { label: "common.jobStatus.employerMarked" as const, cls: "bg-warning-surface text-accent-foreground" },
  COMPLETED: { label: "common.jobStatus.completed" as const, cls: "bg-success-surface text-success" },
} satisfies Record<JobStatus, { label: string; cls: string }>;

/** `title` is the other side of the job: the company for a worker, the worker for an employer. */
export function JobCard({ job, title, children }: { job: Job; title: string; children?: ReactNode }) {
  const { t } = useTranslation();
  const c = chip[job.status];
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Briefcase className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{title}</p>
          <p className="text-sm text-muted-foreground">{t("common.jobDates.started", { date: formatDate(job.createdAt) })}</p>
          {job.workerConfirmedAt && <p className="text-sm text-muted-foreground">{t("common.jobDates.completed", { date: formatDate(job.workerConfirmedAt) })}</p>}
        </div>
      </div>
      <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${c.cls}`}>{t(c.label)}</span>
      {job.rating && (
        <div className="space-y-1 rounded-xl bg-muted p-3">
          <StarRating value={job.rating.stars} />
          {job.rating.comment && <p>{job.rating.comment}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
