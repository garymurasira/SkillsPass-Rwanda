import { skillTypes } from "@/mock/data";
import { SkillIcon } from "./SkillIcon";

export function SkillPicker({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {skillTypes.map((s) => (
        <button key={s.id} type="button" onClick={() => onChange(s.slug)} aria-pressed={value === s.slug}
          className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 font-bold ${value === s.slug ? "border-primary bg-secondary text-primary" : "bg-card"}`}>
          <SkillIcon slug={s.slug} className="h-10 w-10" />
          {s.nameEn}
        </button>
      ))}
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
