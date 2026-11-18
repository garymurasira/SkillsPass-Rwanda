import { useState } from "react";
import { ChevronDown, SlidersHorizontal, SearchX } from "lucide-react";
import { toast } from "sonner";
import { workers, skillTypes } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { WorkerCard } from "@/components/WorkerCard";
import { SkillIcon } from "@/components/SkillIcon";
import { StarRating } from "@/components/StarRating";
import { LocationSelect } from "@/components/LocationSelect";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeletons";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function Filters() {
  const [skill, setSkill] = useState("");
  const [min, setMin] = useState(0);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="font-bold">Skill</p>
        <div className="flex flex-wrap gap-2">
          {skillTypes.map((s) => (
            <button key={s.id} type="button" onClick={() => setSkill(skill === s.slug ? "" : s.slug)} aria-pressed={skill === s.slug}
              className={`flex h-12 items-center gap-2 rounded-full border-2 px-3 text-sm font-bold ${skill === s.slug ? "border-primary bg-secondary text-primary" : "bg-card"}`}>
              <SkillIcon slug={s.slug} className="h-5 w-5" />{s.nameEn}
            </button>
          ))}
        </div>
      </div>
      <LocationSelect />
      <div className="space-y-1">
        <p className="font-bold">Minimum rating</p>
        <StarRating value={min} onChange={setMin} />
      </div>
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
  const state = useViewState();
  const [open, setOpen] = useState(false);
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
          <StateSwitch state={state} loading={<GridSkeleton />} empty={<EmptyState icon={SearchX} title="No workers found" text="No verified workers match your search yet. Try fewer filters." />}>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
            </div>
            <Button variant="outline" size="lg" className="h-12 w-full" onClick={() => toast("Loading more…")}>Load more</Button>
          </StateSwitch>
        </div>
      </div>
    </>
  );
}
