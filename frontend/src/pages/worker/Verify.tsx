import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, CheckCircle2, Clock, PhoneOff, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { FormError } from "@/components/FormError";
import { ListSkeleton } from "@/components/Skeletons";
import { SkillIcon } from "@/components/SkillIcon";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import type { ReferenceResult, WorkerRound } from "@/lib/api/verification";
import type { SkillType } from "@/lib/api/worker";
import { formatDate } from "@/lib/format";
import { useMyVerification, useSubmitReferences } from "@/lib/queries/verification";
import { hasReferenceErrors, referenceErrors, type ReferenceDraft } from "@/lib/validation";

const resultUi: Record<ReferenceResult, { icon: typeof Clock; label: string; cls: string }> = {
  PENDING: { icon: Clock, label: "Waiting for call", cls: "text-muted-foreground" },
  CONFIRMED: { icon: CheckCircle2, label: "Confirmed", cls: "text-success" },
  NOT_CONFIRMED: { icon: XCircle, label: "Not confirmed", cls: "text-destructive" },
  UNREACHABLE: { icon: PhoneOff, label: "Could not reach", cls: "text-accent-foreground" },
};

const RELATIONSHIPS = ["Customer", "Supervisor", "Other"] as const;
const blank = (): ReferenceDraft => ({ name: "", phone: "", relationship: "Customer" });

export default function Verify() {
  const { data, isPending, isError, error, refetch } = useMyVerification();

  return (
    <>
      <PageHeader title="Verify my skill" />
      {isPending ? (
        <div className="p-4"><ListSkeleton rows={3} /></div>
      ) : isError ? (
        <ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data.mainSkill ? (
        <EmptyState
          icon={ShieldCheck}
          title="Choose a main skill first"
          text="Then 3 people who saw your work can confirm it."
          action={<Link to="/worker/skill" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">Choose skill</Link>}
        />
      ) : data.status === "VERIFIED" ? (
        <div className="space-y-4 p-4">
          <p className="flex items-center gap-3 rounded-2xl border-2 border-success bg-success-surface p-4 font-bold text-success">
            <BadgeCheck className="h-6 w-6 shrink-0" />Your {data.mainSkill.skillType.nameEn} skill is verified.
          </p>
          {data.rounds[0] && <References round={data.rounds[0]} />}
        </div>
      ) : data.canSubmit ? (
        <ReferenceForm skillType={data.mainSkill.skillType} retry={data.status === "NOT_VERIFIED"} previous={data.rounds[0]} />
      ) : (
        <div className="space-y-4 p-4">
          <p className="rounded-2xl bg-secondary p-4 font-bold text-secondary-foreground">We are calling your references. A skill becomes Verified when 2 references confirm.</p>
          {data.rounds[0] && <References round={data.rounds[0]} />}
        </div>
      )}
    </>
  );
}

/** The timeline of one round: each person and what they said. */
function References({ round }: { round: WorkerRound }) {
  return (
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
  );
}

function ReferenceForm({ skillType, retry, previous }: { skillType: SkillType; retry: boolean; previous: WorkerRound | undefined }) {
  const submit = useSubmitReferences();
  const [refs, setRefs] = useState<ReferenceDraft[]>([blank(), blank(), blank()]);
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverPhones, setServerPhones] = useState<string | undefined>();

  const errors = referenceErrors(refs);
  const edit = (i: number, patch: Partial<ReferenceDraft>) => setRefs((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function onSubmit() {
    setShowErrors(true);
    setFormError(null);
    setServerPhones(undefined);
    if (hasReferenceErrors(errors)) return;
    try {
      await submit.mutateAsync(refs.map((r) => ({ name: r.name.trim(), phone: r.phone.trim(), relationship: r.relationship })));
      toast.success("Sent for verification"); // the page now switches to the status view by itself
    } catch (e) {
      const msg = fieldError(e, "references");
      if (msg) setServerPhones(msg);
      else setFormError(errorMessage(e));
    }
  }

  return (
    <form className="space-y-4 p-4" noValidate onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}>
      {retry && (
        <p className="rounded-2xl border-2 border-warning-border bg-warning-surface p-4 font-bold">
          Last time we could not confirm enough people{previous ? ` (${formatDate(previous.closedAt)})` : ""}. Give 3 people we can reach, then try again.
        </p>
      )}
      <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
        <SkillIcon slug={skillType.slug} className="h-8 w-8 text-primary" />
        <p>Give 3 people who saw your <b>{skillType.nameEn}</b> work. We will call them.</p>
      </div>
      <FormError>{formError ?? serverPhones ?? (showErrors ? errors.form : undefined)}</FormError>
      {refs.map((r, i) => (
        <div key={i} className="space-y-4 rounded-2xl border bg-card p-4">
          <p className="text-lg font-bold">Person {i + 1}</p>
          <Field label="Name" autoComplete="off" value={r.name} onChange={(name) => edit(i, { name })} error={showErrors ? errors.rows[i]?.name : undefined} />
          <Field label="Phone number" type="tel" placeholder="078 000 0000" autoComplete="off" value={r.phone} onChange={(phone) => edit(i, { phone })} error={showErrors ? errors.rows[i]?.phone : undefined} />
          <div className="space-y-2">
            <p className="font-bold">They are my…</p>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((rel) => (
                <button key={rel} type="button" onClick={() => edit(i, { relationship: rel })} aria-pressed={r.relationship === rel}
                  className={`h-12 rounded-full border-2 px-4 font-bold ${r.relationship === rel ? "border-primary bg-secondary text-primary" : ""}`}>{rel}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={submit.isPending}>{submit.isPending ? "Sending…" : "Submit for verification"}</Button>
    </form>
  );
}
