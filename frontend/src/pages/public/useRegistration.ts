import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { startRegistration, type RegisterBody } from "@/lib/api/auth";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import { isApiError } from "@/lib/api/errors";
import { savePending } from "@/lib/auth/pending";
import { normalizePhone } from "@/lib/phone";

type Errors = Partial<Record<string, string>>;

/**
 * Shared by both registration forms: sends the details, remembers them for the code screen
 * (and for "resend"), then moves on. Server problems come back as field errors or a form-level message.
 */
export function useRegistration(fieldMap: Record<string, string>) {
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({ mutationFn: (body: RegisterBody) => startRegistration(body) });

  async function submit(body: RegisterBody) {
    setServerErrors({});
    setFormError(null);
    let sent: Awaited<ReturnType<typeof startRegistration>>;
    try {
      sent = await mutation.mutateAsync(body);
    } catch (e) {
      const mapped: Errors = {};
      // `fieldMap` translates backend field names to form field names (region -> province, city -> district).
      for (const [serverField, formField] of Object.entries(fieldMap)) {
        const msg = fieldError(e, serverField);
        if (msg) mapped[formField] = msg;
      }
      if (isApiError(e) && e.code === "PHONE_TAKEN") mapped["phone"] = errorMessage(e);
      setServerErrors(mapped);
      if (Object.keys(mapped).length === 0) setFormError(errorMessage(e));
      return;
    }
    savePending({ purpose: "REGISTER", phone: normalizePhone(body.phone), form: body, demoCode: sent.demoCode });
    navigate({ to: "/otp" });
  }

  return { submit, serverErrors, formError, busy: mutation.isPending };
}
