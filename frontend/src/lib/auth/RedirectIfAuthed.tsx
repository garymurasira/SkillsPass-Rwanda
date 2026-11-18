import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "./context";
import { homeForRole } from "./roles";

/** Wrap sign-in and register pages: someone already signed in is sent to their own home. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  return <>{children}</>;
}
