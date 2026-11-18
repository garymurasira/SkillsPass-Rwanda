import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequireRole } from "./RequireRole";
import type { AuthStatus } from "./context";
import type { AuthUser } from "../api/auth";

// Navigate needs a full router; for this test it is enough to see where it would go.
vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
}));

const auth: { status: AuthStatus; user: AuthUser | null } = { status: "loading", user: null };
vi.mock("./context", () => ({ useAuth: () => auth }));

const user = (role: AuthUser["role"]): AuthUser => ({ id: "1", role, name: "Test", language: "EN" });

function renderGuard(role: AuthUser["role"]) {
  render(
    <RequireRole role={role}>
      <p>secret page</p>
    </RequireRole>,
  );
}

describe("RequireRole", () => {
  it("shows a loading state, never the page, while the session is being checked", () => {
    Object.assign(auth, { status: "loading", user: null });
    renderGuard("WORKER");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("secret page")).not.toBeInTheDocument();
  });

  it("sends signed-out visitors to sign in (staff to the staff sign-in)", () => {
    Object.assign(auth, { status: "anonymous", user: null });
    renderGuard("EMPLOYER");
    expect(screen.getByTestId("redirect")).toHaveTextContent("/login");
    expect(screen.queryByText("secret page")).not.toBeInTheDocument();

    renderGuard("ADMIN");
    expect(screen.getAllByTestId("redirect")[1]).toHaveTextContent("/admin/login");
  });

  it("sends the wrong role to their own home", () => {
    Object.assign(auth, { status: "authenticated", user: user("WORKER") });
    renderGuard("ADMIN");
    expect(screen.getByTestId("redirect")).toHaveTextContent("/worker");
    expect(screen.queryByText("secret page")).not.toBeInTheDocument();
  });

  it("shows the page to the right role", () => {
    Object.assign(auth, { status: "authenticated", user: user("EMPLOYER") });
    renderGuard("EMPLOYER");
    expect(screen.getByText("secret page")).toBeInTheDocument();
  });
});
