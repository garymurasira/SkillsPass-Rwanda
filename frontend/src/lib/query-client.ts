import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./api";

// Retrying a 400/401/403/404/409 can never help, only network blips and 5xx can.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (isApiError(error)) return error.status === 0 || error.status >= 500;
  return false;
}

/**
 * Defaults tuned for people on slow, metered mobile data: don't refetch every time the tab
 * regains focus, and keep data fresh for 30 seconds so moving between screens is instant.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: { retry: false },
    },
  });
}
