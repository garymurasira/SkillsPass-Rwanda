import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
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

const filters: { v: JobStatus | undefined; l: string }[] = [
  { v: undefined, l: "All" }, { v: "IN_PROGRESS", l: "In progress" }, { v: "EMPLOYER_MARKED", l: "Marked done" }, { v: "COMPLETED", l: "Completed" },
];

export default function EmployerJobs() {
  const [status, setStatus] = useState<JobStatus | undefined>(undefined);
  const q = useJobs(status);
  const complete = useCompleteJob();
  const [marking, setMarking] = useState<string | null>(null);
  const [rating, setRating] = useState<Job | null>(null);
  const jobs = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title="Jobs" />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((x) => (
            <button key={x.l} type="button" aria-pressed={status === x.v} onClick={() => setStatus(x.v)} className={`h-11 shrink-0 rounded-full border-2 px-4 text-sm font-bold ${status === x.v ? "border-primary bg-secondary text-primary" : ""}`}>{x.l}</button>
          ))}
        </div>
        {q.isPending ? (
          <ListSkeleton />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : jobs.length === 0 ? (
          status ? <EmptyState icon={Briefcase} title="No jobs with this status" /> : <EmptyState icon={Briefcase} title="No jobs yet" text="Start a job from a worker's profile." />
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} title={j.worker.name}>
                  {j.status === "IN_PROGRESS" && <Button size="lg" className="h-12 w-full" disabled={complete.isPending} onClick={() => setMarking(j.id)}>Mark as completed</Button>}
                  {j.status === "EMPLOYER_MARKED" && <p className="text-sm text-muted-foreground">Waiting for the worker to confirm.</p>}
                  {j.canRate && <Button size="lg" className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setRating(j)}>Rate this worker</Button>}
                </JobCard>
              ))}
            </div>
            {q.hasNextPage && (
              <Button variant="outline" size="lg" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={marking !== null}
        onOpenChange={(open) => !open && setMarking(null)}
        tone="default"
        title="Is the work finished?"
        text="The worker will be asked to confirm. After that you can rate them."
        confirmLabel="Yes, mark as completed"
        cancelLabel="Not yet"
        onConfirm={() => marking && complete.mutate(marking, { onSuccess: () => toast.success("Marked as completed"), onError: (e) => toast.error(errorMessage(e)) })}
      />
      {/* Keyed by job so the stars and comment start empty for each worker. */}
      <RateSheet key={rating?.id ?? "none"} job={rating} onClose={() => setRating(null)} />
    </>
  );
}

function RateSheet({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const rate = useRateJob();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Sheet open={job !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl">
        <SheetHeader><SheetTitle className="text-xl">Rate {job?.worker.name ?? "this worker"}</SheetTitle></SheetHeader>
        <div className="space-y-4 p-4">
          <div className="flex justify-center"><StarRating value={stars} onChange={setStars} /></div>
          <div>
            <Textarea value={comment} maxLength={200} onChange={(e) => setComment(e.target.value)} placeholder="Comment (optional)" className="text-base" rows={3} />
            <p className="mt-1 text-right text-sm text-muted-foreground">{comment.length} / 200</p>
          </div>
          <Button size="lg" className="h-14 w-full text-lg" disabled={!stars || rate.isPending || !job}
            onClick={() => job && rate.mutate({ jobId: job.id, stars, comment }, {
              onSuccess: () => { toast.success("Thank you for rating"); onClose(); },
              onError: (e) => toast.error(errorMessage(e)),
            })}>
            {rate.isPending ? "Sending…" : "Submit"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
