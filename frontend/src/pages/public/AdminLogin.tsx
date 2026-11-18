import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { Logo } from "@/components/Logo";
import { useCountdown } from "@/hooks/use-countdown";
import { startLogin, verifyLogin } from "@/lib/api/auth";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import { hasErrorCode } from "@/lib/api/errors";
import { RedirectIfAuthed, useAuth } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { fieldErrors, phoneSchema } from "@/lib/validation";
import { z } from "zod";

const phoneOnly = z.object({ phone: phoneSchema });
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

// Staff sign in on one screen: phone, then the SMS code and the authenticator code together.
export default function AdminLogin() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [totp, setTotp] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [phoneServerError, setPhoneServerError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const { left, restart } = useCountdown(60);

  const sendCode = useMutation({ mutationFn: (p: string) => startLogin(p) });
  const signInMutation = useMutation({ mutationFn: () => verifyLogin(normalizePhone(phone), smsCode, totp) });

  const phoneError = phoneServerError ?? (showErrors ? fieldErrors(phoneOnly, { phone }).phone : undefined);

  async function requestCode() {
    setShowErrors(true);
    setPhoneServerError(undefined);
    setFormError(null);
    if (fieldErrors(phoneOnly, { phone }).phone) return;
    try {
      await sendCode.mutateAsync(phone.trim());
      setSmsCode("");
      setTotp("");
      restart();
      setStep(2);
    } catch (e) {
      const msg = fieldError(e, "phone");
      if (msg) setPhoneServerError(msg);
      else if (hasErrorCode(e, "USER_NOT_FOUND")) setPhoneServerError(errorMessage(e));
      else setFormError(errorMessage(e));
    }
  }

  async function submit() {
    setFormError(null);
    try {
      signIn(await signInMutation.mutateAsync()); // RedirectIfAuthed then moves staff to /admin
    } catch (e) {
      setFormError(errorMessage(e));
      setSmsCode("");
      setTotp("");
    }
  }

  return (
    <RedirectIfAuthed>
      <div className="grid min-h-screen place-items-center bg-muted p-4">
        <form
          noValidate
          onSubmit={(e) => { e.preventDefault(); void (step === 1 ? requestCode() : submit()); }}
          className="w-full max-w-md space-y-5 rounded-3xl border bg-card p-6 shadow-sm"
        >
          <Logo />
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6 text-primary" />Staff sign in</h1>
          <FormError>{formError}</FormError>

          <Field label="Phone number" type="tel" autoComplete="tel" value={phone} disabled={step === 2} error={phoneError}
            onChange={(v) => { setPhone(v); setPhoneServerError(undefined); }} />

          {step === 1 ? (
            <Button type="submit" size="lg" className="h-12 w-full" disabled={sendCode.isPending}>
              {sendCode.isPending ? "Sending…" : "Send SMS code"}
            </Button>
          ) : (
            <>
              <Field label="SMS code" placeholder="6 digits" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={smsCode} onChange={(v) => setSmsCode(digits(v))} />
              <Field label="Authenticator code" placeholder="6 digits" inputMode="numeric" autoComplete="off" maxLength={6} value={totp} onChange={(v) => setTotp(digits(v))} />
              <Button type="submit" size="lg" className="h-12 w-full" disabled={smsCode.length < 6 || totp.length < 6 || signInMutation.isPending}>
                {signInMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" disabled={left > 0 || sendCode.isPending} onClick={() => void requestCode()} className="h-10 font-bold text-primary disabled:text-muted-foreground">
                  {left > 0 ? `Send a new SMS code in ${left}s` : "Send a new SMS code"}
                </button>
                <button type="button" onClick={() => { setStep(1); setFormError(null); }} className="h-10 font-bold text-primary underline">Change number</button>
              </div>
            </>
          )}
        </form>
      </div>
    </RedirectIfAuthed>
  );
}
