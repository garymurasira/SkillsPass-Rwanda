import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { JobCard } from "@/components/JobCard";
import { StarRating } from "@/components/StarRating";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { errorMessage } from "@/lib/api/error-messages";
import type { Job, JobStatus } from "@/lib/api/jobs";
import { useCompleteJob, useJobs, useRateJob } from "@/lib/queries/jobs";

const filters = [
  { v: undefined, l: "employer.jobs.all" }, { v: "IN_PROGRESS", l: "common.jobStatus.inProgress" }, { v: "EMPLOYER_MARKED", l: "employer.jobs.markedDone" }, { v: "COMPLETED", l: "common.jobStatus.completed" },
] as const satisfies readonly { v: JobStatus | undefined; l: string }[];

export default function EmployerJobs() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<JobStatus | undefined>(undefined);
  const q = useJobs(status);
  const complete = useCompleteJob();
  const [marking, setMarking] = useState<string | null>(null);
  const [rating, setRating] = useState<Job | null>(null);
  const jobs = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title={t("employer.jobs.title")} />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((x) => (
            <button key={x.l} type="button" aria-pressed={status === x.v} onClick={() => setStatus(x.v)} className={`h-11 shrink-0 rounded-full border-2 px-4 text-sm font-bold ${status === x.v ? "border-primary bg-secondary text-primary" : ""}`}>{t(x.l)}</button>
          ))}
        </div>
        {q.isPending ? (
          <ListSkeleton />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : jobs.length === 0 ? (
          status ? <EmptyState icon={Briefcase} title={t("employer.jobs.noneWithStatus")} /> : <EmptyState icon={Briefcase} title={t("employer.jobs.emptyTitle")} text={t("employer.jobs.emptyText")} />
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} title={j.worker.name}>
                  {j.status === "IN_PROGRESS" && <Button size="lg" className="h-12 w-full" disabled={complete.isPending} onClick={() => setMarking(j.id)}>{t("employer.jobs.markCompleted")}</Button>}
                  {j.status === "EMPLOYER_MARKED" && <p className="text-sm text-muted-foreground">{t("employer.jobs.waiting")}</p>}
                  {j.canRate && <Button size="lg" className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setRating(j)}>{t("employer.jobs.rate")}</Button>}
                </JobCard>
              ))}
            </div>
            {q.hasNextPage && (
              <Button variant="outline" size="lg" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
              </Button>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={marking !== null}
        onOpenChange={(open) => !open && setMarking(null)}
        tone="default"
        title={t("employer.jobs.markTitle")}
        text={t("employer.jobs.markText")}
        confirmLabel={t("employer.jobs.markYes")}
        cancelLabel={t("employer.jobs.markNo")}
        onConfirm={() => marking && complete.mutate(marking, { onSuccess: () => toast.success(t("employer.jobs.marked")), onError: (e) => toast.error(errorMessage(e)) })}
      />
      {/* Keyed by job so the stars and comment start empty for each worker. */}
      <RateSheet key={rating?.id ?? "none"} job={rating} onClose={() => setRating(null)} />
    </>
  );
}

function RateSheet({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const { t } = useTranslation();
  const rate = useRateJob();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Sheet open={job !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl">
        <SheetHeader><SheetTitle className="text-xl">{job ? t("employer.jobs.rateTitle", { name: job.worker.name }) : t("employer.jobs.rateTitleFallback")}</SheetTitle></SheetHeader>
        <div className="space-y-4 p-4">
          <div className="flex justify-center"><StarRating value={stars} onChange={setStars} /></div>
          <div>
            <Textarea value={comment} maxLength={200} onChange={(e) => setComment(e.target.value)} placeholder={t("employer.jobs.comment")} className="text-base" rows={3} />
            <p className="mt-1 text-right text-sm text-muted-foreground">{comment.length} / 200</p>
          </div>
          <Button size="lg" className="h-14 w-full text-lg" disabled={!stars || rate.isPending || !job}
            onClick={() => job && rate.mutate({ jobId: job.id, stars, comment }, {
              onSuccess: () => { toast.success(t("employer.jobs.thanks")); onClose(); },
              onError: (e) => toast.error(errorMessage(e)),
            })}>
            {rate.isPending ? t("common.sending") : t("employer.jobs.submit")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
