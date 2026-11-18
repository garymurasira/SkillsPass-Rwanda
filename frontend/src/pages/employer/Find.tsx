import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronDown, SlidersHorizontal, SearchX } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { WorkerCard } from "@/components/WorkerCard";
import { SkillIcon } from "@/components/SkillIcon";
import { StarRating } from "@/components/StarRating";
import { LocationSelect } from "@/components/LocationSelect";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { Skeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { errorMessage } from "@/lib/api/error-messages";
import type { SearchFilters } from "@/lib/api/employer";
import { useWorkerSearch } from "@/lib/queries/employer";
import { useSkillTypes } from "@/lib/queries/worker";

/** Reads and writes the filters in the address bar. */
function useFilters() {
  const filters: SearchFilters = useSearch({ from: "/employer/" });
  const navigate = useNavigate();
  const update = (patch: Partial<Record<keyof SearchFilters, string | number | undefined>>) =>
    navigate({
      to: "/employer",
      replace: true,
      // `undefined` removes a filter from the address.
      search: (prev) => ({ ...prev, ...patch }) as SearchFilters,
    });
  return { filters, update };
}

function Filters() {
  const { filters, update } = useFilters();
  const skills = useSkillTypes();
  const active = Object.keys(filters).length > 0;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="font-bold">Skill</p>
        <div className="flex flex-wrap gap-2">
          {skills.data?.map((s) => (
            <button key={s.id} type="button" onClick={() => update({ skill: filters.skill === s.slug ? undefined : s.slug })} aria-pressed={filters.skill === s.slug}
              className={`flex h-12 items-center gap-2 rounded-full border-2 px-3 text-sm font-bold ${filters.skill === s.slug ? "border-primary bg-secondary text-primary" : "bg-card"}`}>
              <SkillIcon slug={s.slug} className="h-5 w-5" />{s.nameEn}
            </button>
          ))}
          {skills.isPending && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-28 rounded-full" />)}
        </div>
      </div>
      <LocationSelect
        province={filters.region ?? ""}
        district={filters.city ?? ""}
        onChange={(region, city) => update({ region: region || undefined, city: city || undefined })}
      />
      <div className="space-y-1">
        <p className="font-bold">Minimum rating</p>
        {/* Tap the chosen star again to remove the filter. */}
        <StarRating value={filters.minRating ?? 0} onChange={(n) => update({ minRating: n === filters.minRating ? undefined : n })} />
      </div>
      {active && (
        <Button variant="outline" className="h-12 w-full" onClick={() => update({ skill: undefined, region: undefined, city: undefined, minRating: undefined })}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3" aria-label="Loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border p-3">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
        </div>
      ))}
    </div>
  );
}

export default function Find() {
  const { filters } = useFilters();
  const [open, setOpen] = useState(false);
  const q = useWorkerSearch(filters);
  const workers = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;

  return (
    <>
      <PageHeader title="Find verified workers" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:items-start md:gap-6 md:p-6">
        <aside className="hidden w-72 shrink-0 rounded-2xl border bg-card p-4 md:sticky md:top-20 md:block">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><SlidersHorizontal className="h-5 w-5" />Filters</h2>
          <Filters />
        </aside>
        <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border bg-card md:hidden">
          <CollapsibleTrigger className="flex h-14 w-full items-center gap-2 px-4 font-bold">
            <SlidersHorizontal className="h-5 w-5 text-primary" /><span className="flex-1 text-left">Filters</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t p-4"><Filters /></CollapsibleContent>
        </Collapsible>
        <div className="min-w-0 flex-1 space-y-4">
          {q.isPending ? (
            <GridSkeleton />
          ) : q.isError ? (
            <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
          ) : workers.length === 0 ? (
            <EmptyState icon={SearchX} title="No workers found" text="No verified workers match your search yet. Try fewer filters." />
          ) : (
            <>
              <p className="text-sm text-muted-foreground" aria-live="polite">{total} verified {total === 1 ? "worker" : "workers"}</p>
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
      </div>
    </>
  );
}
