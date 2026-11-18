import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { LocationSelect } from "@/components/LocationSelect";
import { fieldErrors, workerRegistrationSchema } from "@/lib/validation";
import { AuthLayout } from "./AuthLayout";
import { useRegistration } from "./useRegistration";

export default function RegisterWorker() {
  const [form, setForm] = useState({ name: "", phone: "", province: "", district: "" });
  const [showErrors, setShowErrors] = useState(false);
  const { submit, serverErrors, formError, busy } = useRegistration({ name: "name", phone: "phone", region: "province", city: "district" });

  const clientErrors = showErrors ? fieldErrors(workerRegistrationSchema, form) : {};
  const errors = { ...clientErrors, ...serverErrors };
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <AuthLayout title="Register as worker">
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setShowErrors(true);
          if (Object.keys(fieldErrors(workerRegistrationSchema, form)).length > 0) return;
          void submit({
            role: "WORKER",
            name: form.name.trim(),
            phone: form.phone.trim(),
            language: "EN", // the app is English-only for now; the user can change this in Settings later
            region: form.province,
            city: form.district,
          });
        }}
      >
        <FormError>{formError}</FormError>
        <Field label="Your name" placeholder="e.g. Jean Claude" autoComplete="name" value={form.name} onChange={(name) => set({ name })} error={errors.name} />
        <Field label="Phone number" type="tel" placeholder="078 000 0000" autoComplete="tel" value={form.phone} onChange={(phone) => set({ phone })} error={errors.phone} />
        <LocationSelect
          province={form.province}
          district={form.district}
          onChange={(province, district) => set({ province, district })}
          errors={{ province: errors.province, district: errors.district }}
        />
        <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={busy}>{busy ? "Sending…" : "Send me a code"}</Button>
      </form>
      <p className="text-center">Already registered? <Link to="/login" className="font-bold text-primary underline underline-offset-4">Sign in</Link></p>
    </AuthLayout>
  );
}
