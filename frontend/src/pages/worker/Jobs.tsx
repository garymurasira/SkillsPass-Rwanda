import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { JobCard } from "@/components/JobCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useCompleteJob, useJobs } from "@/lib/queries/jobs";

export default function WorkerJobs() {
  const q = useJobs();
  const complete = useCompleteJob();
  const [confirming, setConfirming] = useState<string | null>(null);
  const jobs = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title="My jobs" />
      <div className="space-y-3 p-4">
        {q.isPending ? (
          <ListSkeleton />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs yet" text="When an employer starts a job with you, it shows here." />
        ) : (
          <>
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} title={j.employer.companyName}>
                {j.status === "EMPLOYER_MARKED" && (
                  <Button size="lg" className="h-14 w-full text-lg" disabled={complete.isPending} onClick={() => setConfirming(j.id)}>Confirm job completed</Button>
                )}
                {j.status === "IN_PROGRESS" && <p className="text-sm text-muted-foreground">When the work is done, the employer marks it here and you confirm.</p>}
              </JobCard>
            ))}
            {q.hasNextPage && (
              <Button variant="outline" size="lg" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        tone="default"
        title="Is the job finished?"
        text="Confirm only if the work is done. After that, the employer can rate you."
        confirmLabel="Yes, it is finished"
        cancelLabel="Not yet"
        onConfirm={() => confirming && complete.mutate(confirming, { onSuccess: () => toast.success("Job confirmed"), onError: (e) => toast.error(errorMessage(e)) })}
      />
    </>
  );
}
