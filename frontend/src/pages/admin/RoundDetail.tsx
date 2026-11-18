import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { errorMessage } from "@/lib/api/error-messages";
import { hasErrorCode } from "@/lib/api/errors";
import type { ReferenceResult } from "@/lib/api/verification";
import { formatDateTime } from "@/lib/format";
import { useRecordResult, useRound } from "@/lib/queries/verification";

type Recordable = Exclude<ReferenceResult, "PENDING">;
const opts: { v: Recordable; l: string }[] = [{ v: "CONFIRMED", l: "Confirmed" }, { v: "NOT_CONFIRMED", l: "Not confirmed" }, { v: "UNREACHABLE", l: "Unreachable" }];

export default function RoundDetail({ id }: { id: string }) {
  const q = useRound(id);
  const record = useRecordResult();

  const back = <Link to="/admin" className="inline-flex items-center gap-1 font-bold text-primary"><ArrowLeft className="h-4 w-4" />Back to queue</Link>;

  if (q.isPending) return <div className="max-w-3xl space-y-4">{back}<ListSkeleton rows={3} /></div>;
  if (q.isError) {
    return (
      <div className="max-w-3xl space-y-4">
        {back}
        {hasErrorCode(q.error, "ROUND_NOT_FOUND") ? <EmptyState title="Round not found" /> : <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} />}
      </div>
    );
  }

  const r = q.data;
  const closed = r.status !== "OPEN";

  function pick(referenceId: string, result: Recordable) {
    record.mutate({ referenceId, result }, {
      onSuccess: (round) => {
        if (round.status === "VERIFIED") toast.success("Two references confirmed: the skill is now verified.");
        else if (round.status === "NOT_VERIFIED") toast("Two confirmations are no longer possible: the skill is not verified.");
        else toast.success("Saved");
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  }

  return (
    <div className="max-w-3xl space-y-4">
      {back}
      <h1 className="text-2xl font-bold">{r.worker.name}</h1>
      <p className="text-muted-foreground">{r.skill.name} · {r.skill.yearsOfExperience} years · {r.worker.city}, {r.worker.region} · Round {r.roundNumber}</p>
      {closed && <p className="flex items-center gap-2 rounded-2xl bg-muted p-4 font-bold"><Lock className="h-5 w-5" />Round closed. Results can no longer be changed.</p>}
      <p className="rounded-2xl bg-secondary p-4">Two confirmations verify the skill. There is no manual approve button.</p>
      {r.references.map((x) => (
        <div key={x.id} className="space-y-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-bold">{x.name}</p><p className="text-sm text-muted-foreground">{x.relationship}</p></div>
            <a href={`tel:${x.phone}`} className="flex h-11 items-center gap-2 rounded-xl border px-3 font-bold text-primary"><Phone className="h-4 w-4" />{x.phone}</a>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border" role="group" aria-label={`Result for ${x.name}`}>
            {opts.map((o) => (
              <button key={o.v} disabled={closed || record.isPending} aria-pressed={x.result === o.v} onClick={() => pick(x.id, o.v)}
                className={`h-12 border-l px-1 text-sm font-bold first:border-l-0 disabled:opacity-60 ${x.result === o.v ? "bg-primary text-primary-foreground" : ""}`}>{o.l}</button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Recorded at: {formatDateTime(x.recordedAt)}</p>
        </div>
      ))}
    </div>
  );
}
