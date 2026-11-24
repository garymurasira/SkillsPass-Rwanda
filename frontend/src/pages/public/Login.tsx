import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { startLogin } from "@/lib/api/auth";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import { isApiError } from "@/lib/api/errors";
import { savePending } from "@/lib/auth/pending";
import { normalizePhone } from "@/lib/phone";
import { fieldErrors, phoneSchema } from "@/lib/validation";
import { z } from "zod";
import { AuthLayout } from "./AuthLayout";

const schema = z.object({ phone: phoneSchema });

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [serverPhoneError, setServerPhoneError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: (p: string) => startLogin(p) });

  const phoneError = serverPhoneError ?? (showErrors ? fieldErrors(schema, { phone }).phone : undefined);

  async function onSubmit() {
    setShowErrors(true);
    setServerPhoneError(undefined);
    setFormError(null);
    if (fieldErrors(schema, { phone }).phone) return;
    try {
      await mutation.mutateAsync(phone.trim());
    } catch (e) {
      const msg = fieldError(e, "phone");
      if (msg) setServerPhoneError(msg);
      else if (isApiError(e) && e.code === "USER_NOT_FOUND") setServerPhoneError(errorMessage(e));
      else setFormError(errorMessage(e));
      return;
    }
    savePending({ purpose: "LOGIN", phone: normalizePhone(phone) });
    navigate({ to: "/otp" });
  }

  return (
    <AuthLayout title={t("auth.login.title")}>
      <form className="space-y-5" noValidate onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}>
        <FormError>{formError}</FormError>
        <Field label={t("auth.login.phone")} type="tel" placeholder={t("auth.phonePlaceholder")} autoComplete="tel" value={phone} onChange={(v) => { setPhone(v); setServerPhoneError(undefined); }} error={phoneError} />
        <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={mutation.isPending}>{mutation.isPending ? t("common.sending") : t("common.sendCode")}</Button>
      </form>
      <p className="text-center">{t("auth.login.noAccount")} <Link to="/" className="font-bold text-primary underline underline-offset-4">{t("auth.login.register")}</Link></p>
    </AuthLayout>
  );
}
