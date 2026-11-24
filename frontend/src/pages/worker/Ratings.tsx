import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { StarRating } from "@/components/StarRating";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { ReviewList } from "@/components/ReviewList";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useMyRatings } from "@/lib/queries/jobs";

export default function Ratings() {
  const { t } = useTranslation();
  const q = useMyRatings();
  const first = q.data?.pages[0];
  const reviews = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title={t("worker.ratings.title")} back />
      <div className="space-y-4 p-4">
        {q.isPending ? (
          <ListSkeleton rows={3} />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : !first || first.count === 0 || first.average === null ? (
          <EmptyState icon={Star} title={t("worker.ratings.emptyTitle")} text={t("worker.ratings.emptyText")} />
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-secondary p-6">
              <p className="text-5xl font-bold">{first.average.toFixed(1)}</p>
              <StarRating value={first.average} size="lg" />
              <p className="text-muted-foreground">{t("worker.ratings.count", { count: first.count })}</p>
            </div>
            <ReviewList reviews={reviews} />
            {q.hasNextPage && (
              <Button variant="outline" size="lg" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}
