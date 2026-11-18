import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
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
  const { data, isPending, isError, error, refetch } = useMyProfile();
  return (
    <>
      <PageHeader title="Choose main skill" back />
      {isPending ? <div className="p-4"><ListSkeleton /></div> : isError ? <ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} /> : <SkillForm profile={data} />}
    </>
  );
}

function SkillForm({ profile }: { profile: WorkerProfile }) {
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
      toast.success(current?.status === "VERIFIED" && skill === original ? "Saved. Staff will review your new experience." : "Main skill saved");
      navigate({ to: "/worker" });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const changingSkill = current !== null && skill !== original;

  return (
    <div className="space-y-6 p-4">
      <SkillPicker value={skill} onChange={setSkill} />
      <div className="space-y-2"><h2 className="text-lg font-bold">Years of experience</h2><YearsStepper value={years} onChange={setYears} /></div>
      <Button size="lg" className="h-14 w-full text-lg" disabled={!skill || setMain.isPending} onClick={() => (changingSkill ? setWarn(true) : void save())}>
        {setMain.isPending ? "Saving…" : "Save"}
      </Button>
      <ConfirmDialog
        open={warn}
        onOpenChange={setWarn}
        title={<span className="flex items-center gap-2"><TriangleAlert className="h-6 w-6 text-destructive" />Change main skill?</span>}
        text="Changing your main skill will remove your Verified status and hide you from employers. You will need to give 3 new references."
        confirmLabel="Yes, change it"
        cancelLabel="Keep my skill"
        onConfirm={() => void save()}
      />
    </div>
  );
}
