import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Verify from "./Verify";
import type { VerificationStatus } from "@/lib/api/verification";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
  useRouter: () => ({ history: { back: vi.fn() } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mutateAsync = vi.fn();
let query: { data?: VerificationStatus; isPending: boolean; isError: boolean; error: unknown; refetch: () => void };
vi.mock("@/lib/queries/verification", () => ({
  useMyVerification: () => query,
  useSubmitReferences: () => ({ mutateAsync, isPending: false }),
}));

const skillType = { id: "t1", slug: "plumber", nameEn: "Plumber", nameRw: "", nameFr: "" };
const status = (over: Partial<VerificationStatus>): VerificationStatus => ({
  mainSkill: { id: "s1", skillType, yearsOfExperience: 5 }, status: "PENDING", canSubmit: true, rounds: [], ...over,
});
const set = (data: VerificationStatus) => { query = { data, isPending: false, isError: false, error: null, refetch: vi.fn() }; };

beforeEach(() => { mutateAsync.mockReset(); });

describe("Verify page", () => {
  it("asks for a main skill first when there is none", () => {
    set(status({ mainSkill: null, status: null, canSubmit: false }));
    render(<Verify />);
    expect(screen.getByText("Choose a main skill first")).toBeInTheDocument();
  });

  it("shows the reference form, and refuses to send it until it is filled in correctly", async () => {
    set(status({}));
    render(<Verify />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for verification" }));
    expect((await screen.findAllByText("Please enter their name.")).length).toBe(3);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("sends three references when the form is valid", async () => {
    set(status({}));
    mutateAsync.mockResolvedValue({});
    render(<Verify />);
    const names = screen.getAllByLabelText("Name");
    const phones = screen.getAllByLabelText("Phone number");
    ["Ana", "Ben", "Cy"].forEach((n, i) => fireEvent.change(names[i]!, { target: { value: n } }));
    ["0788123401", "0788123402", "0788123403"].forEach((p, i) => fireEvent.change(phones[i]!, { target: { value: p } }));
    fireEvent.click(screen.getByRole("button", { name: "Submit for verification" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0]![0]).toEqual([
      { name: "Ana", phone: "0788123401", relationship: "Customer" },
      { name: "Ben", phone: "0788123402", relationship: "Customer" },
      { name: "Cy", phone: "0788123403", relationship: "Customer" },
    ]);
  });

  it("shows the timeline, not the form, while a round is open", () => {
    set(status({
      canSubmit: false,
      rounds: [{ id: "r1", roundNumber: 1, status: "OPEN", createdAt: "2026-11-01T00:00:00Z", closedAt: null, references: [
        { id: "a", name: "Ana", relationship: "Customer", result: "CONFIRMED", recordedAt: "2026-11-02T00:00:00Z" },
        { id: "b", name: "Ben", relationship: "Other", result: "PENDING", recordedAt: null },
        { id: "c", name: "Cy", relationship: "Supervisor", result: "UNREACHABLE", recordedAt: "2026-11-02T00:00:00Z" },
      ] }],
    }));
    render(<Verify />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Waiting for call")).toBeInTheDocument();
    expect(screen.getByText("Could not reach")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit for verification" })).not.toBeInTheDocument();
  });

  it("congratulates a verified worker and explains a failed round before showing the form again", () => {
    set(status({ status: "VERIFIED", canSubmit: false }));
    const { unmount } = render(<Verify />);
    expect(screen.getByText(/skill is verified/)).toBeInTheDocument();
    unmount();

    set(status({ status: "NOT_VERIFIED", canSubmit: true }));
    render(<Verify />);
    expect(screen.getByText(/could not confirm enough people/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit for verification" })).toBeInTheDocument();
  });
});
