import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { LocationSelect } from "@/components/LocationSelect";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ProfileSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, fieldError } from "@/lib/api/error-messages";
import type { WorkerProfile } from "@/lib/api/worker";
import { syncSessionName, useMyProfile, useUpdateProfile } from "@/lib/queries/worker";
import { fieldErrors } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(2, "errors.validation.nameShort").max(100, "errors.validation.nameLong"),
  province: z.string().min(1, "errors.validation.province"),
  district: z.string().min(1, "errors.validation.district"),
  bio: z.string().max(300),
});

export default function EditProfile() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useMyProfile();
  return (
    <>
      <PageHeader title={t("worker.edit.title")} back />
      {isPending ? <ProfileSkeleton /> : isError ? <ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} /> : <EditForm profile={data} />}
    </>
  );
}

// Rendered only once the profile has loaded, so the form can start from the real values.
function EditForm({ profile }: { profile: WorkerProfile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    name: profile.name, province: profile.region, district: profile.city, bio: profile.bio ?? "", shareContact: profile.shareContact,
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
        name: form.name.trim(), region: form.province, city: form.district, bio: form.bio.trim(), shareContact: form.shareContact,
      });
      syncSessionName(saved.name);
      toast.success(t("worker.edit.saved"));
      navigate({ to: "/worker" });
    } catch (e) {
      const mapped: Record<string, string> = {};
      for (const [serverField, formField] of [["name", "name"], ["region", "province"], ["city", "district"], ["bio", "bio"]] as const) {
        const msg = fieldError(e, serverField);
        if (msg) mapped[formField] = msg;
      }
      setServerErrors(mapped);
      if (Object.keys(mapped).length === 0) setFormError(errorMessage(e));
    }
  }

  return (
    <form className="space-y-5 p-4" noValidate onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <FormError>{formError}</FormError>
      <Field label={t("common.yourName")} autoComplete="name" value={form.name} onChange={(name) => set({ name })} error={errors.name} />
      <LocationSelect
        province={form.province}
        district={form.district}
        onChange={(province, district) => set({ province, district })}
        errors={{ province: errors.province, district: errors.district }}
      />
      <div className="space-y-2">
        <Label className="text-base">{t("worker.edit.aboutMe")}</Label>
        <Textarea value={form.bio} maxLength={300} onChange={(e) => set({ bio: e.target.value })} rows={5} className="text-base" placeholder={t("worker.edit.bioPlaceholder")} />
        <p className="text-right text-sm text-muted-foreground">{form.bio.length} / 300</p>
      </div>
      <label className="flex items-center justify-between gap-4 rounded-2xl border p-4">
        <span className="font-bold">{t("worker.edit.shareContact")}</span>
        <Switch checked={form.shareContact} onCheckedChange={(shareContact) => set({ shareContact })} />
      </label>
      <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={update.isPending}>{update.isPending ? t("common.saving") : t("common.save")}</Button>
    </form>
  );
}
