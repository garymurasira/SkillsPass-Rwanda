import { Delete } from "lucide-react";

export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string) => {
    if (k === "del") onChange(value.slice(0, -1));
    else if (value.length < 6) onChange(value + k);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2" aria-label="Code">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`grid h-14 w-11 place-items-center rounded-xl border-2 text-2xl font-bold ${i === value.length ? "border-primary" : ""}`}>
            {value[i] ?? ""}
          </div>
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
          k === "" ? <span key={i} /> : (
            <button key={i} type="button" onClick={() => press(k)} aria-label={k === "del" ? "Delete" : k}
              className="grid h-16 place-items-center rounded-2xl bg-muted text-2xl font-bold active:bg-secondary">
              {k === "del" ? <Delete className="h-7 w-7" /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
