import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { confirmPhoneChange, requestPhoneChange } from "@/lib/api/worker";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import { isApiError } from "@/lib/api/errors";
import { normalizePhone } from "@/lib/phone";
import { fieldErrors, phoneSchema } from "@/lib/validation";
import { z } from "zod";
import { OtpBody } from "./public/Otp";

const schema = z.object({ phone: phoneSchema });

// Used by workers and employers. The new number only replaces the old one once its SMS code is confirmed.
export default function ChangePhone({ backTo }: { backTo: "/worker/settings" | "/employer/settings" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [phoneServerError, setPhoneServerError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const request = useMutation({ mutationFn: (p: string) => requestPhoneChange(p) });

  const phoneError = phoneServerError ?? (showErrors ? fieldErrors(schema, { phone }).phone : undefined);

  async function sendCode() {
    setShowErrors(true);
    setPhoneServerError(undefined);
    setFormError(null);
    if (fieldErrors(schema, { phone }).phone) return;
    try {
      await request.mutateAsync(phone.trim());
      setStep(2);
    } catch (e) {
      const msg = fieldError(e, "phone");
      if (msg) setPhoneServerError(msg);
      else if (isApiError(e) && e.code === "PHONE_TAKEN") setPhoneServerError(errorMessage(e));
      else setFormError(errorMessage(e));
    }
  }

  async function confirm(code: string): Promise<string | null> {
    try {
      await confirmPhoneChange(code);
      await qc.invalidateQueries({ queryKey: ["worker"] }); // the profile shows the phone number
      toast.success(t("worker.phone.changed"));
      navigate({ to: backTo });
      return null;
    } catch (e) {
      return errorMessage(e);
    }
  }

  async function resend(): Promise<string | null> {
    try {
      await requestPhoneChange(normalizePhone(phone));
      return null;
    } catch (e) {
      return errorMessage(e);
    }
  }

  return (
    <>
      <PageHeader title={step === 1 ? t("worker.phone.newTitle") : t("worker.phone.codeTitle")} back />
      <div className="space-y-5 p-4">
        <p className="text-sm font-bold text-muted-foreground">{t("worker.phone.step", { step })}</p>
        {step === 1 ? (
          <form className="space-y-5" noValidate onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
            <FormError>{formError}</FormError>
            <Field label={t("worker.phone.newLabel")} type="tel" placeholder={t("auth.phonePlaceholder")} autoComplete="tel" value={phone}
              onChange={(v) => { setPhone(v); setPhoneServerError(undefined); }} error={phoneError} />
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={request.isPending}>{request.isPending ? t("common.sending") : t("common.sendCode")}</Button>
          </form>
        ) : (
          <OtpBody onSubmit={confirm} onResend={resend} onWrongNumber={() => setStep(1)} />
        )}
      </div>
    </>
  );
}
