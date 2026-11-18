import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { currentWorker } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { SkillPicker, YearsStepper } from "@/components/SkillPicker";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChooseSkill() {
  const navigate = useNavigate();
  const original = currentWorker.mainSkill.skillType.slug;
  const [skill, setSkill] = useState(original);
  const [years, setYears] = useState(currentWorker.mainSkill.yearsOfExperience);
  const [warn, setWarn] = useState(false);
  const save = () => { toast.success("Main skill saved"); navigate({ to: "/worker" }); };
  return (
    <>
      <PageHeader title="Choose main skill" back />
      <div className="space-y-6 p-4">
        <SkillPicker value={skill} onChange={setSkill} />
        <div className="space-y-2"><h2 className="text-lg font-bold">Years of experience</h2><YearsStepper value={years} onChange={setYears} /></div>
        <Button size="lg" className="h-14 w-full text-lg" onClick={() => (skill !== original ? setWarn(true) : save())}>Save</Button>
      </div>
      <AlertDialog open={warn} onOpenChange={setWarn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><TriangleAlert className="h-6 w-6 text-destructive" />Change main skill?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">Changing your main skill will remove your Verified status and hide you from employers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12">Keep my skill</AlertDialogCancel>
            <AlertDialogAction className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={save}>Yes, change it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
