import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Clock, PhoneOff, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { verification, currentWorker, type RefResult } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { SkillIcon } from "@/components/SkillIcon";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";

const resultUi: Record<RefResult, { icon: typeof Clock; label: string; cls: string }> = {
  pending: { icon: Clock, label: "Waiting for call", cls: "text-muted-foreground" },
  confirmed: { icon: CheckCircle2, label: "Confirmed", cls: "text-success" },
  not_confirmed: { icon: XCircle, label: "Not confirmed", cls: "text-destructive" },
  unreachable: { icon: PhoneOff, label: "Could not reach", cls: "text-accent-foreground" },
};

function RefCard({ n }: { n: number }) {
  const [rel, setRel] = useState("Customer");
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <p className="text-lg font-bold">Person {n}</p>
      <Field label="Name" />
      <Field label="Phone number" type="tel" />
      <div className="space-y-2">
        <p className="font-bold">They are my…</p>
        <div className="flex flex-wrap gap-2">
          {["Customer", "Supervisor", "Other"].map((r) => (
            <button key={r} type="button" onClick={() => setRel(r)} aria-pressed={rel === r}
              className={`h-12 rounded-full border-2 px-4 font-bold ${rel === r ? "border-primary bg-secondary text-primary" : ""}`}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusView() {
  const round = verification.rounds[0]!;
  return (
    <div className="space-y-4 p-4">
      <p className="rounded-2xl bg-secondary p-4 font-bold text-secondary-foreground">A skill becomes Verified when 2 references confirm.</p>
      <ol className="relative space-y-4 border-l-2 border-border pl-6">
        {round.references.map((r) => {
          const u = resultUi[r.result];
          return (
            <li key={r.id} className="relative">
              <span className={`absolute -left-[38px] grid h-8 w-8 place-items-center rounded-full bg-background ${u.cls}`}><u.icon className="h-7 w-7" /></span>
              <div className="rounded-2xl border p-4">
                <p className="font-bold">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.relationship}</p>
                <p className={`mt-1 font-bold ${u.cls}`}>{u.label}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Verify() {
  const s = useRouterState({ select: (r) => (r.location.search as Record<string, unknown>)["state"] as string | undefined });
  const view = s === "form" || s === "empty" || s === "loading" || s === "error" ? s : "status";
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <PageHeader title="Verify my skill" />
      {view === "loading" && <div className="p-4"><ListSkeleton rows={3} /></div>}
      {view === "error" && <ErrorRetry />}
      {view === "empty" && <EmptyState icon={ShieldCheck} title="Choose a main skill first" text="Then 3 people who saw your work can confirm it." action={<Link to="/worker/skill" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">Choose skill</Link>} />}
      {view === "status" && <StatusView />}
      {view === "form" && (submitted ? <StatusView /> : (
        <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); toast.success("Sent for verification"); setSubmitted(true); }}>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
            <SkillIcon slug={currentWorker.mainSkill.skillType.slug} className="h-8 w-8 text-primary" />
            <p>Give 3 people who saw your <b>{currentWorker.mainSkill.skillType.nameEn}</b> work. We will call them.</p>
          </div>
          {[1, 2, 3].map((n) => <RefCard key={n} n={n} />)}
          <Button type="submit" size="lg" className="h-14 w-full text-lg">Submit for verification</Button>
        </form>
      ))}
    </>
  );
}
