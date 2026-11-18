import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import type { Role } from "../api/auth";
import { useAuth } from "./context";
import { homeForRole } from "./roles";

/**
 * Wraps a whole area (worker, employer, admin). Signed-out visitors go to the sign-in page,
 * and people with the wrong role go back to their own home instead of seeing a 403.
 * This is a convenience, not security: the backend enforces roles on every request.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <div role="status" aria-live="polite" className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to={role === "ADMIN" ? "/admin/login" : "/login"} replace />;
  if (user.role !== role) return <Navigate to={homeForRole(user.role)} replace />;
  return <>{children}</>;
}
