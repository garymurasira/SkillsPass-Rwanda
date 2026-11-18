import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { WorkerCard } from "@/components/WorkerCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useFavorites } from "@/lib/queries/employer";

export default function Favorites() {
  const q = useFavorites();
  const workers = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <PageHeader title="Favorites" />
      <div className="space-y-4 p-4 md:p-6">
        {q.isPending ? (
          <ListSkeleton />
        ) : q.isError ? (
          <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        ) : workers.length === 0 ? (
          <EmptyState icon={Heart} title="No favorites yet" text="Tap the heart on a worker to save them here."
            action={<Link to="/employer" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">Find workers</Link>} />
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
            </div>
            {q.hasNextPage && (
              <Button variant="outline" size="lg" className="h-12 w-full" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}
