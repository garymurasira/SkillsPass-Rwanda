import type { ReactNode } from "react";

/** A message above a form for problems that belong to the whole form, not one field. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-base font-bold text-destructive">
      {children}
    </div>
  );
}
