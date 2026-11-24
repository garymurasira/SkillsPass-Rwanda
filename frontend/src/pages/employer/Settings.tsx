import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
  name: z.string().trim().min(2, "errors.validation.nameShort").max(100, "errors.validation.nameLong"),
  companyName: z.string().trim().min(2, "errors.validation.companyShort").max(120, "errors.validation.nameLong"),
  province: z.string().min(1, "errors.validation.province"),
  district: z.string().min(1, "errors.validation.district"),
  contactInfo: z.string().trim().min(3, "errors.validation.contactShort").max(200, "errors.validation.contactLong"),
});

export default function EmployerSettings() {
  const { t } = useTranslation();
  const q = useEmployerProfile();
  return (
    <>
      <PageHeader title={t("employer.settings.title")} />
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
  const { t } = useTranslation();
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
      toast.success(t("employer.settings.saved"));
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
      <h2 className="text-lg font-bold">{t("employer.settings.companyProfile")}</h2>
      <FormError>{formError}</FormError>
      <Field label={t("common.yourName")} autoComplete="name" value={form.name} onChange={(name) => set({ name })} error={errors.name} />
      <Field label={t("auth.registerEmployer.company")} autoComplete="organization" value={form.companyName} onChange={(companyName) => set({ companyName })} error={errors.companyName} />
      <LocationSelect province={form.province} district={form.district} onChange={(province, district) => set({ province, district })} errors={{ province: errors.province, district: errors.district }} />
      <Field label={t("auth.registerEmployer.contact")} value={form.contactInfo} onChange={(contactInfo) => set({ contactInfo })} error={errors.contactInfo} />
      <Button type="submit" size="lg" className="h-12 w-full" disabled={update.isPending}>{update.isPending ? t("common.saving") : t("common.save")}</Button>
    </form>
  );
}
