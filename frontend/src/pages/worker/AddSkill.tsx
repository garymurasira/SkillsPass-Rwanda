import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SkillPicker, YearsStepper } from "@/components/SkillPicker";
import { Button } from "@/components/ui/button";

export default function AddSkill() {
  const navigate = useNavigate();
  const [skill, setSkill] = useState("");
  const [years, setYears] = useState(1);
  return (
    <>
      <PageHeader title="Add other skill" back />
      <div className="space-y-6 p-4">
        <SkillPicker value={skill} onChange={setSkill} />
        <div className="space-y-2"><h2 className="text-lg font-bold">Years of experience</h2><YearsStepper value={years} onChange={setYears} /></div>
        <Button size="lg" disabled={!skill} className="h-14 w-full text-lg" onClick={() => { toast.success("Skill added"); navigate({ to: "/worker" }); }}>Add skill</Button>
      </div>
    </>
  );
}
