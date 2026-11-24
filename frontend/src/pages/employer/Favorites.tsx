import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { WorkerCard } from "@/components/WorkerCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useFavorites } from "@/lib/queries/employer";

export default function Favorites() {
  const { t } = useTranslation();
  const q = useFavorites();
  const workers = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title={t("employer.favorites.title")} />
      <div className="space-y-4 p-4 md:p-6">
        {q.isPending ? (
          <ListSkeleton />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : workers.length === 0 ? (
          <EmptyState icon={Heart} title={t("employer.favorites.emptyTitle")} text={t("employer.favorites.emptyText")}
            action={<Link to="/employer" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">{t("employer.favorites.findWorkers")}</Link>} />
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
            </div>
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
