import { Flag } from "lucide-react";
import { toast } from "sonner";
import { flaggedSkills } from "@/mock/data";
import { EmptyState } from "@/components/EmptyState";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { Button } from "@/components/ui/button";

export default function Flagged() {
  const state = useViewState();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Flagged skills</h1>
      <StateSwitch state={state} empty={<EmptyState icon={Flag} title="No flagged skills" />}>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-muted text-sm"><tr>{["Worker", "Skill", "Years", "Status", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>{flaggedSkills.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-bold">{f.worker.name}</td><td className="p-3">{f.skill}</td><td className="p-3">{f.yearsOfExperience}</td>
                <td className="p-3"><span className="rounded-full bg-destructive/10 px-2 py-1 text-sm font-bold text-destructive">{f.status}</span></td>
                <td className="p-3"><Button variant="outline" onClick={() => toast.success("Flag cleared")}>Clear flag</Button></td>
              </tr>))}</tbody>
          </table>
        </div>
      </StateSwitch>
    </div>
  );
}
