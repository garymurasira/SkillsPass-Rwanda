import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ErrorRetry } from "./ErrorRetry";
import { ListSkeleton } from "./Skeletons";

export type ViewState = "ready" | "empty" | "loading" | "error";

/** Reads the prototype-only `?state=empty|loading|error` URL param. */
export function useViewState(): ViewState {
  const s = useRouterState({ select: (r) => (r.location.search as Record<string, unknown>)["state"] as string | undefined });
  return s === "empty" || s === "loading" || s === "error" ? s : "ready";
}

export function StateSwitch({ state, loading, empty, children }: { state: ViewState; loading?: ReactNode; empty: ReactNode; children: ReactNode }) {
  if (state === "loading") return <>{loading ?? <ListSkeleton />}</>;
  if (state === "error") return <ErrorRetry />;
  if (state === "empty") return <>{empty}</>;
  return <>{children}</>;
}
