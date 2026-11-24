import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { SkillPicker, YearsStepper } from "@/components/SkillPicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/error-messages";
import type { WorkerProfile } from "@/lib/api/worker";
import { useMyProfile, useSetMainSkill, useSkillTypes } from "@/lib/queries/worker";

export default function ChooseSkill() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useMyProfile();
  return (
    <>
      <PageHeader title={t("worker.chooseSkill.title")} back />
      {isPending ? <div className="p-4"><ListSkeleton /></div> : isError ? <ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} /> : <SkillForm profile={data} />}
    </>
  );
}

function SkillForm({ profile }: { profile: WorkerProfile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const types = useSkillTypes();
  const setMain = useSetMainSkill();
  const current = profile.mainSkill;
  const original = current?.skillType.slug ?? "";

  const [skill, setSkill] = useState(original);
  const [years, setYears] = useState(current?.yearsOfExperience ?? 1);
  const [warn, setWarn] = useState(false);

  async function save() {
    const skillTypeId = types.data?.find((t) => t.slug === skill)?.id;
    if (!skillTypeId) return;
    if (current && skill === original && years === current.yearsOfExperience) return navigate({ to: "/worker" }); // nothing changed
    try {
      await setMain.mutateAsync({ skillTypeId, years });
      // BR 4(b): a verified skill stays verified when only the years change, but staff are asked to check.
      toast.success(current?.status === "VERIFIED" && skill === original ? t("worker.chooseSkill.savedReview") : t("worker.chooseSkill.saved"));
      navigate({ to: "/worker" });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const changingSkill = current !== null && skill !== original;

  return (
    <div className="space-y-6 p-4">
      <SkillPicker value={skill} onChange={setSkill} />
      <div className="space-y-2"><h2 className="text-lg font-bold">{t("worker.chooseSkill.years")}</h2><YearsStepper value={years} onChange={setYears} /></div>
      <Button size="lg" className="h-14 w-full text-lg" disabled={!skill || setMain.isPending} onClick={() => (changingSkill ? setWarn(true) : void save())}>
        {setMain.isPending ? t("common.saving") : t("common.save")}
      </Button>
      <ConfirmDialog
        open={warn}
        onOpenChange={setWarn}
        title={<span className="flex items-center gap-2"><TriangleAlert className="h-6 w-6 text-destructive" />{t("worker.chooseSkill.warnTitle")}</span>}
        text={t("worker.chooseSkill.warnText")}
        confirmLabel={t("worker.chooseSkill.warnYes")}
        cancelLabel={t("worker.chooseSkill.warnKeep")}
        onConfirm={() => void save()}
      />
    </div>
  );
}
