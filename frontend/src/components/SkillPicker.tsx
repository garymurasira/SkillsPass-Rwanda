import { useSkillTypes } from "@/lib/queries/worker";
import { errorMessage } from "@/lib/api/error-messages";
import { ErrorRetry } from "./ErrorRetry";
import { Skeleton } from "./Skeletons";
import { SkillIcon } from "./SkillIcon";

type Props = {
  /** The chosen skill's slug. */
  value: string;
  onChange: (slug: string) => void;
  /** Skills that can't be picked, e.g. the ones the worker already has. */
  disabledSlugs?: string[];
};

export function SkillPicker({ value, onChange, disabledSlugs = [] }: Props) {
  const { data, isPending, isError, error, refetch } = useSkillTypes();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3" aria-label="Loading skills">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }
  if (isError) return <ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <div className="grid grid-cols-2 gap-3">
      {data.map((s) => {
        const disabled = disabledSlugs.includes(s.slug);
        return (
          <button key={s.id} type="button" disabled={disabled} onClick={() => onChange(s.slug)} aria-pressed={value === s.slug}
            className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 font-bold disabled:opacity-40 ${value === s.slug ? "border-primary bg-secondary text-primary" : "bg-card"}`}>
            <SkillIcon slug={s.slug} className="h-10 w-10" />
            {s.nameEn}
          </button>
        );
      })}
    </div>
  );
}

export function YearsStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-3">
      <button type="button" aria-label="Less" onClick={() => onChange(Math.max(0, value - 1))} className="h-14 w-14 rounded-full bg-muted text-3xl font-bold">−</button>
      <div className="text-center"><p className="text-4xl font-bold">{value}</p><p className="text-sm text-muted-foreground">years</p></div>
      <button type="button" aria-label="More" onClick={() => onChange(Math.min(60, value + 1))} className="h-14 w-14 rounded-full bg-primary text-3xl font-bold text-primary-foreground">+</button>
    </div>
  );
}
