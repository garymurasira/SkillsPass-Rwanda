import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OtpBody } from "./Otp";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
  Navigate: () => null,
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ signIn: vi.fn() }), RedirectIfAuthed: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const type = (code: string) => code.split("").forEach((d) => fireEvent.click(screen.getByRole("button", { name: d })));

describe("OtpBody", () => {
  it("keeps Continue disabled until all 6 digits are typed", () => {
    render(<OtpBody onSubmit={async () => null} />);
    const next = screen.getByRole("button", { name: "Continue" });
    type("12345");
    expect(next).toBeDisabled();
    type("6");
    expect(next).toBeEnabled();
  });

  it("shows the error and clears the digits when the code is rejected", async () => {
    const onSubmit = vi.fn().mockResolvedValue("That code is wrong or has expired.");
    render(<OtpBody onSubmit={onSubmit} />);
    type("123456");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("wrong or has expired");
    expect(onSubmit).toHaveBeenCalledWith("123456");
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled());
  });

  it("makes people wait before asking for another code", () => {
    render(<OtpBody onSubmit={async () => null} onResend={async () => null} />);
    expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled();
  });
});
