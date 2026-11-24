import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { SkillPicker, YearsStepper } from "@/components/SkillPicker";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import { useAddOtherSkill, useMyProfile, useSkillTypes } from "@/lib/queries/worker";

export default function AddSkill() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useMyProfile();
  const types = useSkillTypes();
  const add = useAddOtherSkill();
  const [skill, setSkill] = useState("");
  const [years, setYears] = useState(1);

  async function save() {
    const skillTypeId = types.data?.find((t) => t.slug === skill)?.id;
    if (!skillTypeId) return;
    try {
      await add.mutateAsync({ skillTypeId, years });
      toast.success(t("worker.addSkill.added"));
      navigate({ to: "/worker" });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  // A skill can only be on the profile once, so the ones already there can't be picked again.
  const taken = profile.data
    ? [profile.data.mainSkill?.skillType.slug, ...profile.data.otherSkills.map((s) => s.skillType.slug)].filter((s): s is string => !!s)
    : [];

  return (
    <>
      <PageHeader title={t("worker.addSkill.title")} back />
      {profile.isPending ? (
        <div className="p-4"><ListSkeleton /></div>
      ) : profile.isError ? (
        <ErrorRetry text={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
      ) : (
        <div className="space-y-6 p-4">
          <SkillPicker value={skill} onChange={setSkill} disabledSlugs={taken} />
          <div className="space-y-2"><h2 className="text-lg font-bold">{t("worker.chooseSkill.years")}</h2><YearsStepper value={years} onChange={setYears} /></div>
          <Button size="lg" disabled={!skill || add.isPending} className="h-14 w-full text-lg" onClick={() => void save()}>{add.isPending ? t("worker.addSkill.adding") : t("worker.addSkill.add")}</Button>
        </div>
      )}
    </>
  );
}
