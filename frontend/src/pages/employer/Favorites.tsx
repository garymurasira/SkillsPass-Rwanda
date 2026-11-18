import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { workers } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { WorkerCard } from "@/components/WorkerCard";
import { EmptyState } from "@/components/EmptyState";
import { StateSwitch, useViewState } from "@/components/ViewState";

export default function Favorites() {
  const state = useViewState();
  return (
    <>
      <PageHeader title="Favorites" />
      <div className="p-4 md:p-6">
        <StateSwitch state={state} empty={<EmptyState icon={Heart} title="No favorites yet" text="Tap the heart on a worker to save them here." action={<Link to="/employer" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">Find workers</Link>} />}>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {workers.filter((w) => w.isFavorite).map((w) => <WorkerCard key={w.id} worker={{ ...w, isFavorite: true }} />)}
          </div>
        </StateSwitch>
      </div>
    </>
  );
}
