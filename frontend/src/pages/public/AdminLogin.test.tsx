import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminLogin from "./AdminLogin";
import { ApiError } from "@/lib/api/errors";

const startLogin = vi.fn();
const verifyLogin = vi.fn();
const signIn = vi.fn();
vi.mock("@/lib/api/auth", () => ({ startLogin: (...a: unknown[]) => startLogin(...a), verifyLogin: (...a: unknown[]) => verifyLogin(...a) }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ signIn }), RedirectIfAuthed: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const typeInto = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const renderPage = () =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><AdminLogin /></QueryClientProvider>);

async function reachStep2() {
  renderPage();
  typeInto("Phone number", "0780000000");
  fireEvent.click(screen.getByRole("button", { name: "Send SMS code" }));
  await screen.findByLabelText("SMS code");
}

beforeEach(() => { startLogin.mockReset().mockResolvedValue({}); verifyLogin.mockReset(); signIn.mockReset(); });

describe("Staff sign in", () => {
  it("checks the phone number before asking for a code", async () => {
    renderPage();
    typeInto("Phone number", "123");
    fireEvent.click(screen.getByRole("button", { name: "Send SMS code" }));
    expect(await screen.findByText(/valid MTN or Airtel/)).toBeInTheDocument();
    expect(startLogin).not.toHaveBeenCalled();
  });

  it("asks for both codes, and signs in with the phone, SMS code and authenticator code", async () => {
    await reachStep2();
    verifyLogin.mockResolvedValue({ user: { role: "ADMIN" }, accessToken: "a", refreshToken: "r", expiresIn: 900 });
    typeInto("SMS code", "123456");
    typeInto("Authenticator code", "654321");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(verifyLogin).toHaveBeenCalledWith("+250780000000", "123456", "654321");
  });

  it("keeps the SMS code after a wrong authenticator code, so only that has to be retyped", async () => {
    await reachStep2();
    verifyLogin.mockRejectedValue(new ApiError(401, "TOTP_INVALID"));
    typeInto("SMS code", "123456");
    typeInto("Authenticator code", "000000");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("authenticator code is wrong");
    expect(screen.getByLabelText("SMS code")).toHaveValue("123456");
    expect(screen.getByLabelText("Authenticator code")).toHaveValue("");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("clears both codes when the SMS code itself was wrong", async () => {
    await reachStep2();
    verifyLogin.mockRejectedValue(new ApiError(400, "OTP_INVALID"));
    typeInto("SMS code", "111111");
    typeInto("Authenticator code", "222222");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("wrong or has expired");
    expect(screen.getByLabelText("SMS code")).toHaveValue("");
    expect(screen.getByLabelText("Authenticator code")).toHaveValue("");
  });
});
