import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/** `back="mobile"` shows the back arrow on phones only (where the page replaces a list, as in chat). */
export function PageHeader({ title, back, right }: { title: string; back?: boolean | "mobile"; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background px-2">
      {back && (
        <button type="button" aria-label="Back" onClick={() => router.history.back()} className={`grid h-12 w-12 place-items-center rounded-full hover:bg-muted ${back === "mobile" ? "md:hidden" : ""}`}>
          <ArrowLeft className="h-6 w-6" />
        </button>
      )}
      <h1 className={`flex-1 truncate text-xl font-bold ${back === true ? "" : back === "mobile" ? "md:px-2" : "px-2"}`}>{title}</h1>
      {right}
    </header>
  );
}
