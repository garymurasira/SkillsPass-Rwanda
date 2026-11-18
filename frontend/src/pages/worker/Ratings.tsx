import { Star } from "lucide-react";
import { currentWorker } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { StarRating } from "@/components/StarRating";
import { EmptyState } from "@/components/EmptyState";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { ReviewList } from "@/components/ReviewList";

export default function Ratings() {
  const state = useViewState();
  const r = currentWorker.rating;
  return (
    <>
      <PageHeader title="My ratings" back />
      <div className="space-y-4 p-4">
        <StateSwitch state={state} empty={<EmptyState icon={Star} title="No ratings yet" text="After a job is completed, the employer can rate you." />}>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-secondary p-6">
            <p className="text-5xl font-bold">{r.average.toFixed(1)}</p>
            <StarRating value={r.average} size="lg" />
            <p className="text-muted-foreground">{r.count} ratings</p>
          </div>
          <ReviewList reviews={currentWorker.reviews} />
        </StateSwitch>
      </div>
    </>
  );
}
