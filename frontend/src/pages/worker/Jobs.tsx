import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const q = useJobs();
  const complete = useCompleteJob();
  const [confirming, setConfirming] = useState<string | null>(null);
  const jobs = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title={t("worker.jobs.title")} />
      <div className="space-y-3 p-4">
        {q.isPending ? (
          <ListSkeleton />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title={t("worker.jobs.emptyTitle")} text={t("worker.jobs.emptyText")} />
        ) : (
          <>
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} title={j.employer.companyName}>
                {j.status === "EMPLOYER_MARKED" && (
                  <Button size="lg" className="h-14 w-full text-lg" disabled={complete.isPending} onClick={() => setConfirming(j.id)}>{t("worker.jobs.confirm")}</Button>
                )}
                {j.status === "IN_PROGRESS" && <p className="text-sm text-muted-foreground">{t("worker.jobs.hint")}</p>}
              </JobCard>
            ))}
            {q.hasNextPage && (
              <Button variant="outline" size="lg" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
              </Button>
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        tone="default"
        title={t("worker.jobs.confirmTitle")}
        text={t("worker.jobs.confirmText")}
        confirmLabel={t("worker.jobs.confirmYes")}
        cancelLabel={t("worker.jobs.confirmNo")}
        onConfirm={() => confirming && complete.mutate(confirming, { onSuccess: () => toast.success(t("worker.jobs.confirmed")), onError: (e) => toast.error(errorMessage(e)) })}
      />
    </>
  );
}
