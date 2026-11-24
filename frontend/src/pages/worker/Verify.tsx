import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, CheckCircle2, Clock, PhoneOff, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useSkillName } from "@/lib/i18n/hooks";
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

const resultUi = {
  PENDING: { icon: Clock, cls: "text-muted-foreground" },
  CONFIRMED: { icon: CheckCircle2, cls: "text-success" },
  NOT_CONFIRMED: { icon: XCircle, cls: "text-destructive" },
  UNREACHABLE: { icon: PhoneOff, cls: "text-accent-foreground" },
} satisfies Record<ReferenceResult, { icon: typeof Clock; cls: string }>;

const RELATIONSHIPS = ["Customer", "Supervisor", "Other"] as const;
/** The relationship is stored in English; show it in the interface language when it is one of the known three. */
const relationshipLabel = (t: TFunction, value: string) =>
  (RELATIONSHIPS as readonly string[]).includes(value) ? t(`verify.relationship.${value as (typeof RELATIONSHIPS)[number]}`) : value;
const blank = (): ReferenceDraft => ({ name: "", phone: "", relationship: "Customer" });

export default function Verify() {
  const { t } = useTranslation();
  const skillName = useSkillName();
  const { data, isPending, isError, error, refetch } = useMyVerification();

  return (
    <>
      <PageHeader title={t("verify.title")} />
      {isPending ? (
        <div className="p-4"><ListSkeleton rows={3} /></div>
      ) : isError ? (
        <ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data.mainSkill ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("verify.chooseFirstTitle")}
          text={t("verify.chooseFirstText")}
          action={<Link to="/worker/skill" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">{t("verify.chooseSkill")}</Link>}
        />
      ) : data.status === "VERIFIED" ? (
        <div className="space-y-4 p-4">
          <p className="flex items-center gap-3 rounded-2xl border-2 border-success bg-success-surface p-4 font-bold text-success">
            <BadgeCheck className="h-6 w-6 shrink-0" />{t("verify.verified", { skill: skillName(data.mainSkill.skillType) })}
          </p>
          {data.rounds[0] && <References round={data.rounds[0]} />}
        </div>
      ) : data.canSubmit ? (
        <ReferenceForm skillType={data.mainSkill.skillType} retry={data.status === "NOT_VERIFIED"} previous={data.rounds[0]} />
      ) : (
        <div className="space-y-4 p-4">
          <p className="rounded-2xl bg-secondary p-4 font-bold text-secondary-foreground">{t("verify.calling")}</p>
          {data.rounds[0] && <References round={data.rounds[0]} />}
        </div>
      )}
    </>
  );
}

/** The timeline of one round: each person and what they said. */
function References({ round }: { round: WorkerRound }) {
  const { t } = useTranslation();
  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-6">
      {round.references.map((r) => {
        const u = resultUi[r.result];
        return (
          <li key={r.id} className="relative">
            <span className={`absolute -left-[38px] grid h-8 w-8 place-items-center rounded-full bg-background ${u.cls}`}><u.icon className="h-7 w-7" /></span>
            <div className="rounded-2xl border p-4">
              <p className="font-bold">{r.name}</p>
              <p className="text-sm text-muted-foreground">{relationshipLabel(t, r.relationship)}</p>
              <p className={`mt-1 font-bold ${u.cls}`}>{t(`verify.result.${r.result}`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ReferenceForm({ skillType, retry, previous }: { skillType: SkillType; retry: boolean; previous: WorkerRound | undefined }) {
  const { t } = useTranslation();
  const skillName = useSkillName();
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
      toast.success(t("verify.sent")); // the page now switches to the status view by itself
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
          {t("verify.retry", { when: previous ? t("verify.retryWhen", { date: formatDate(previous.closedAt) }) : "" })}
        </p>
      )}
      <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
        <SkillIcon slug={skillType.slug} className="h-8 w-8 text-primary" />
        <p><Trans i18nKey="verify.intro" values={{ skill: skillName(skillType) }} components={{ b: <b /> }} /></p>
      </div>
      <FormError>{formError ?? serverPhones ?? (showErrors ? errors.form : undefined)}</FormError>
      {refs.map((r, i) => (
        <div key={i} className="space-y-4 rounded-2xl border bg-card p-4">
          <p className="text-lg font-bold">{t("verify.person", { n: i + 1 })}</p>
          <Field label={t("verify.name")} autoComplete="off" value={r.name} onChange={(name) => edit(i, { name })} error={showErrors ? errors.rows[i]?.name : undefined} />
          <Field label={t("verify.phone")} type="tel" placeholder={t("auth.phonePlaceholder")} autoComplete="off" value={r.phone} onChange={(phone) => edit(i, { phone })} error={showErrors ? errors.rows[i]?.phone : undefined} />
          <div className="space-y-2">
            <p className="font-bold">{t("verify.theyAre")}</p>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((rel) => (
                <button key={rel} type="button" onClick={() => edit(i, { relationship: rel })} aria-pressed={r.relationship === rel}
                  className={`h-12 rounded-full border-2 px-4 font-bold ${r.relationship === rel ? "border-primary bg-secondary text-primary" : ""}`}>{t(`verify.relationship.${rel}`)}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={submit.isPending}>{submit.isPending ? t("common.sending") : t("verify.submit")}</Button>
    </form>
  );
}
