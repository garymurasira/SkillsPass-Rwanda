import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/FormError";
import { OtpInput } from "@/components/OtpInput";
import { useCountdown } from "@/hooks/use-countdown";
import { startLogin, startRegistration, verifyLogin, verifyRegistration } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/error-messages";
import { hasErrorCode } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { clearPending, readPending, type PendingAuth } from "@/lib/auth/pending";
import { AuthLayout } from "./AuthLayout";

type OtpBodyProps = {
  /** Prototype use (phone change, until Stage 4): called when Continue is pressed. */
  onDone?: () => void;
  /** Real use: resolves with an error message to show, or null when it worked. */
  onSubmit?: (code: string) => Promise<string | null>;
  /** Asks for a new code. Resolves with an error message, or null when it worked. */
  onResend?: () => Promise<string | null>;
  wrongNumberTo?: string;
};

export function OtpBody({ onDone, onSubmit, onResend, wrongNumberTo = "/login" }: OtpBodyProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { left, restart } = useCountdown(60);

  async function submit() {
    if (!onSubmit) return onDone?.();
    setBusy(true);
    setError(null);
    const message = await onSubmit(code);
    setBusy(false);
    if (message) {
      setError(message);
      setCode(""); // start the next try from an empty box
    }
  }

  async function resend() {
    setError(null);
    const message = onResend ? await onResend() : null;
    if (message) return setError(message);
    setCode("");
    restart();
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-lg">Enter the 6-digit code we sent by SMS.</p>
      <FormError>{error}</FormError>
      <OtpInput value={code} onChange={setCode} />
      <Button size="lg" className="h-14 w-full text-lg" disabled={code.length < 6 || busy} onClick={() => void submit()}>
        {busy ? "Checking…" : "Continue"}
      </Button>
      <div className="flex justify-between text-base">
        <button type="button" disabled={left > 0} onClick={() => void resend()} className="h-12 font-bold text-primary disabled:text-muted-foreground">
          {left > 0 ? `Resend code in ${left}s` : "Resend code"}
        </button>
        <Link to={wrongNumberTo as "/"} className="flex h-12 items-center font-bold text-primary underline">Wrong number?</Link>
      </div>
    </div>
  );
}

export default function Otp() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  // Read after mount: the pending sign-in lives in sessionStorage, which the server can't see.
  const [pending, setPending] = useState<PendingAuth | null | undefined>(undefined);
  useEffect(() => setPending(readPending()), []);

  if (pending === undefined) return <AuthLayout title="Enter code">{null}</AuthLayout>;
  // Nothing in progress (page opened directly, or the tab was closed): start from sign-in.
  if (pending === null) return <Navigate to="/login" replace />;

  const wrongNumberTo =
    pending.purpose === "LOGIN" ? "/login" : pending.form.role === "EMPLOYER" ? "/register/employer" : "/register/worker";

  async function onSubmit(code: string): Promise<string | null> {
    if (!pending) return null;
    try {
      const result =
        pending.purpose === "REGISTER" ? await verifyRegistration(pending.phone, code) : await verifyLogin(pending.phone, code);
      clearPending();
      signIn(result); // the layout then sends them to their own home
      return null;
    } catch (e) {
      // A staff account tried the normal sign-in. The code is used up, so they continue on the staff page.
      if (hasErrorCode(e, "TOTP_REQUIRED")) {
        clearPending();
        toast.info(errorMessage(e));
        navigate({ to: "/admin/login", replace: true });
        return null;
      }
      return errorMessage(e);
    }
  }

  async function onResend(): Promise<string | null> {
    if (!pending) return null;
    try {
      if (pending.purpose === "REGISTER") await startRegistration(pending.form);
      else await startLogin(pending.phone);
      return null;
    } catch (e) {
      return errorMessage(e);
    }
  }

  return (
    <AuthLayout title="Enter code">
      <OtpBody onSubmit={onSubmit} onResend={onResend} wrongNumberTo={wrongNumberTo} />
    </AuthLayout>
  );
}
