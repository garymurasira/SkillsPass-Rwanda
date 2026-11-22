import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { value: number; count?: number; size?: "sm" | "lg"; onChange?: (v: number) => void };

export function StarRating({ value, count, size = "sm", onChange }: Props) {
  if (count === 0 && !onChange) return <span className="text-sm text-muted-foreground">No ratings yet</span>;
  const cls = size === "lg" ? "h-9 w-9" : "h-4 w-4";
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star className={cn(cls, n <= Math.round(value) ? "fill-star text-star" : "text-border")} />;
        return onChange ? (
          <button key={n} type="button" aria-label={`${n} stars`} onClick={() => onChange(n)} className="grid h-12 w-12 place-items-center">
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
      {count !== undefined && <span className="ml-1 text-sm text-muted-foreground">{value.toFixed(1)} ({count})</span>}
    </span>
  );
}
