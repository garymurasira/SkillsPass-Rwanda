import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { jobs, type JobStatus } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { JobCard } from "@/components/JobCard";
import { StarRating } from "@/components/StarRating";
import { EmptyState } from "@/components/EmptyState";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const filters: { v: "all" | JobStatus; l: string }[] = [
  { v: "all", l: "All" }, { v: "in_progress", l: "In progress" }, { v: "employer_marked_done", l: "Marked done" }, { v: "completed", l: "Completed" },
];

export default function EmployerJobs() {
  const state = useViewState();
  const [f, setF] = useState<"all" | JobStatus>("all");
  const [rate, setRate] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const list = jobs.filter((j) => f === "all" || j.status === f);
  return (
    <>
      <PageHeader title="Jobs" />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((x) => (
            <button key={x.v} type="button" onClick={() => setF(x.v)} className={`h-11 shrink-0 rounded-full border-2 px-4 text-sm font-bold ${f === x.v ? "border-primary bg-secondary text-primary" : ""}`}>{x.l}</button>
          ))}
        </div>
        <StateSwitch state={state} empty={<EmptyState icon={Briefcase} title="No jobs yet" text="Start a job from a worker's profile." />}>
          {list.length === 0 ? <EmptyState icon={Briefcase} title="No jobs with this status" /> : (
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((j) => (
                <JobCard key={j.id} job={j} title={j.worker.name}>
                  {j.status === "in_progress" && <Button size="lg" className="h-12 w-full" onClick={() => toast.success("Marked as completed")}>Mark as completed</Button>}
                  {j.status === "completed" && j.canRate && <Button size="lg" className="h-12 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setRate(true)}>Rate this worker</Button>}
                </JobCard>
              ))}
            </div>
          )}
        </StateSwitch>
      </div>
      <Sheet open={rate} onOpenChange={setRate}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl">
          <SheetHeader><SheetTitle className="text-xl">Rate this worker</SheetTitle></SheetHeader>
          <div className="space-y-4 p-4">
            <div className="flex justify-center"><StarRating value={stars} onChange={setStars} /></div>
            <div>
              <Textarea value={comment} maxLength={200} onChange={(e) => setComment(e.target.value)} placeholder="Comment (optional)" className="text-base" rows={3} />
              <p className="mt-1 text-right text-sm text-muted-foreground">{comment.length} / 200</p>
            </div>
            <Button size="lg" className="h-14 w-full text-lg" disabled={!stars} onClick={() => { toast.success("Thank you for rating"); setRate(false); }}>Submit</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
