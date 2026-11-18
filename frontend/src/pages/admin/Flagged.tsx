import { Flag } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useClearFlag, useFlaggedSkills } from "@/lib/queries/verification";

const statusLabel = { VERIFIED: "Verified", PENDING: "Pending", NOT_VERIFIED: "Not verified" } as const;

export default function Flagged() {
  const q = useFlaggedSkills();
  const clear = useClearFlag();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Flagged skills</h1>
      <p className="text-muted-foreground">Workers who changed their years of experience after being verified. Check it looks right, then clear the flag.</p>
      {q.isPending ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState icon={Flag} title="No flagged skills" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-muted text-sm"><tr>{["Worker", "Skill", "Years", "Status", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>{q.data.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 font-bold">{f.worker.name}</td><td className="p-3">{f.skill}</td><td className="p-3">{f.yearsOfExperience}</td>
                <td className="p-3"><span className="rounded-full bg-destructive/10 px-2 py-1 text-sm font-bold text-destructive">Needs review · {statusLabel[f.status]}</span></td>
                <td className="p-3">
                  <Button variant="outline" disabled={clear.isPending} onClick={() => clear.mutate(f.id, { onSuccess: () => toast.success("Flag cleared"), onError: (e) => toast.error(errorMessage(e)) })}>Clear flag</Button>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
