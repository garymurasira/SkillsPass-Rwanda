import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { jobs } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { Button } from "@/components/ui/button";

export default function WorkerJobs() {
  const state = useViewState();
  return (
    <>
      <PageHeader title="My jobs" />
      <div className="space-y-3 p-4">
        <StateSwitch state={state} empty={<EmptyState icon={Briefcase} title="No jobs yet" text="When an employer starts a job with you, it shows here." />}>
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} title={j.employer.companyName}>
              {j.status === "employer_marked_done" && (
                <Button size="lg" className="h-14 w-full text-lg" onClick={() => toast.success("Job confirmed")}>Confirm job completed</Button>
              )}
            </JobCard>
          ))}
        </StateSwitch>
      </div>
    </>
  );
}
