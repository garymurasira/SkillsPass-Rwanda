import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ history: { back: vi.fn() } }) }));

describe("PageHeader", () => {
  it("has no back arrow by default", () => {
    render(<PageHeader title="Jobs" />);
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("shows the back arrow everywhere when asked", () => {
    render(<PageHeader title="Edit profile" back />);
    expect(screen.getByRole("button", { name: "Back" })).not.toHaveClass("md:hidden");
  });

  it("can show the back arrow on phones only (a chat beside its list on a laptop)", () => {
    render(<PageHeader title="Chat" back="mobile" />);
    expect(screen.getByRole("button", { name: "Back" })).toHaveClass("md:hidden");
  });
});
