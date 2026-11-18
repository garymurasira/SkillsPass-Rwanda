import { useState } from "react";
import { Phone, Lock } from "lucide-react";
import { adminRounds, type RefResult } from "@/mock/data";
import { EmptyState } from "@/components/EmptyState";

const opts: { v: RefResult; l: string }[] = [{ v: "confirmed", l: "Confirmed" }, { v: "not_confirmed", l: "Not confirmed" }, { v: "unreachable", l: "Unreachable" }];

export default function RoundDetail({ id }: { id: string }) {
  const r = adminRounds.find((x) => x.id === id);
  const [res, setRes] = useState<Record<string, RefResult>>(() => Object.fromEntries((r?.references ?? []).map((x) => [x.id, x.result])));
  if (!r) return <EmptyState title="Round not found" />;
  const closed = r.status !== "open";
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{r.worker.name}</h1>
      <p className="text-muted-foreground">{r.skill.name} · {r.skill.yearsOfExperience} years · {r.worker.city}, {r.worker.region} · Round {r.roundNumber}</p>
      {closed && <p className="flex items-center gap-2 rounded-2xl bg-muted p-4 font-bold"><Lock className="h-5 w-5" />Round closed — results can no longer be changed.</p>}
      <p className="rounded-2xl bg-secondary p-4">Two confirmations verify the skill. There is no manual approve button.</p>
      {r.references.map((x) => (
        <div key={x.id} className="space-y-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-bold">{x.name}</p><p className="text-sm text-muted-foreground">{x.relationship}</p></div>
            <a href={`tel:${x.phone}`} className="flex h-11 items-center gap-2 rounded-xl border px-3 font-bold text-primary"><Phone className="h-4 w-4" />{x.phone}</a>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border">
            {opts.map((o) => (
              <button key={o.v} disabled={closed} onClick={() => setRes({ ...res, [x.id]: o.v })}
                className={`h-12 border-l px-1 text-sm font-bold first:border-l-0 disabled:opacity-60 ${res[x.id] === o.v ? "bg-primary text-primary-foreground" : ""}`}>{o.l}</button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Recorded at: {x.recordedAt ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}
