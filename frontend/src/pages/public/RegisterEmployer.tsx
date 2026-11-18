import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { LocationSelect } from "@/components/LocationSelect";
import { employerRegistrationSchema, fieldErrors } from "@/lib/validation";
import { AuthLayout } from "./AuthLayout";
import { useRegistration } from "./useRegistration";

export default function RegisterEmployer() {
  const [form, setForm] = useState({ name: "", phone: "", companyName: "", province: "", district: "", contactInfo: "" });
  const [showErrors, setShowErrors] = useState(false);
  const { submit, serverErrors, formError, busy } = useRegistration({
    name: "name", phone: "phone", companyName: "companyName", region: "province", city: "district", contactInfo: "contactInfo",
  });

  const clientErrors = showErrors ? fieldErrors(employerRegistrationSchema, form) : {};
  const errors = { ...clientErrors, ...serverErrors };
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <AuthLayout title="Register as employer">
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setShowErrors(true);
          if (Object.keys(fieldErrors(employerRegistrationSchema, form)).length > 0) return;
          void submit({
            role: "EMPLOYER",
            name: form.name.trim(),
            phone: form.phone.trim(),
            language: "EN",
            region: form.province,
            city: form.district,
            companyName: form.companyName.trim(),
            contactInfo: form.contactInfo.trim(),
          });
        }}
      >
        <FormError>{formError}</FormError>
        <Field label="Your name" autoComplete="name" value={form.name} onChange={(name) => set({ name })} error={errors.name} />
        <Field label="Phone number" type="tel" placeholder="078 000 0000" autoComplete="tel" value={form.phone} onChange={(phone) => set({ phone })} error={errors.phone} />
        <Field label="Company name" autoComplete="organization" value={form.companyName} onChange={(companyName) => set({ companyName })} error={errors.companyName} />
        <LocationSelect
          province={form.province}
          district={form.district}
          onChange={(province, district) => set({ province, district })}
          errors={{ province: errors.province, district: errors.district }}
        />
        <Field label="Contact info" placeholder="Email or office address" value={form.contactInfo} onChange={(contactInfo) => set({ contactInfo })} error={errors.contactInfo} />
        <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={busy}>{busy ? "Sending…" : "Send me a code"}</Button>
      </form>
      <p className="text-center">Already registered? <Link to="/login" className="font-bold text-primary underline underline-offset-4">Sign in</Link></p>
    </AuthLayout>
  );
}
