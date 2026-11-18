import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { LocationSelect } from "@/components/LocationSelect";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import type { EmployerProfile } from "@/lib/api/employer";
import { useEmployerProfile, useUpdateEmployerProfile } from "@/lib/queries/employer";
import { syncSessionName } from "@/lib/queries/worker";
import { fieldErrors } from "@/lib/validation";
import { SettingsCommon } from "../SettingsCommon";

const schema = z.object({
  name: z.string().trim().min(2, "Your name needs at least 2 letters.").max(100, "That name is too long."),
  companyName: z.string().trim().min(2, "The company name needs at least 2 letters.").max(120, "That name is too long."),
  province: z.string().min(1, "Please choose a province."),
  district: z.string().min(1, "Please choose a district."),
  contactInfo: z.string().trim().min(3, "Please enter an email or address.").max(200, "That is too long."),
});

export default function EmployerSettings() {
  const q = useEmployerProfile();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-xl">
        <SettingsCommon phoneTo="/employer/settings/phone">
          {q.isPending ? <ListSkeleton rows={3} /> : q.isError ? <ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : <CompanyForm profile={q.data} />}
        </SettingsCommon>
      </div>
    </>
  );
}

// Rendered once the profile has loaded, so the form starts from the saved values.
function CompanyForm({ profile }: { profile: EmployerProfile }) {
  const update = useUpdateEmployerProfile();
  const [form, setForm] = useState({
    name: profile.name, companyName: profile.companyName, province: profile.region, district: profile.city, contactInfo: profile.contactInfo,
  });
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const errors = { ...(showErrors ? fieldErrors(schema, form) : {}), ...serverErrors };

  async function save() {
    setShowErrors(true);
    setServerErrors({});
    setFormError(null);
    if (Object.keys(fieldErrors(schema, form)).length > 0) return;
    try {
      const saved = await update.mutateAsync({
        name: form.name.trim(), companyName: form.companyName.trim(), region: form.province, city: form.district, contactInfo: form.contactInfo.trim(),
      });
      syncSessionName(saved.name);
      toast.success("Company profile saved");
    } catch (e) {
      const mapped: Record<string, string> = {};
      for (const [serverField, formField] of [["name", "name"], ["companyName", "companyName"], ["region", "province"], ["city", "district"], ["contactInfo", "contactInfo"]] as const) {
        const msg = fieldError(e, serverField);
        if (msg) mapped[formField] = msg;
      }
      setServerErrors(mapped);
      if (Object.keys(mapped).length === 0) setFormError(errorMessage(e));
    }
  }

  return (
    <form className="space-y-4 rounded-2xl border p-4" noValidate onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <h2 className="text-lg font-bold">Company profile</h2>
      <FormError>{formError}</FormError>
      <Field label="Your name" autoComplete="name" value={form.name} onChange={(name) => set({ name })} error={errors.name} />
      <Field label="Company name" autoComplete="organization" value={form.companyName} onChange={(companyName) => set({ companyName })} error={errors.companyName} />
      <LocationSelect province={form.province} district={form.district} onChange={(province, district) => set({ province, district })} errors={{ province: errors.province, district: errors.district }} />
      <Field label="Contact info" value={form.contactInfo} onChange={(contactInfo) => set({ contactInfo })} error={errors.contactInfo} />
      <Button type="submit" size="lg" className="h-12 w-full" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
