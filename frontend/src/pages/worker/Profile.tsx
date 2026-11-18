import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, MapPin, Pencil, Plus, Star, UserRound } from "lucide-react";
import { currentWorker } from "@/mock/data";
import { PageHeader } from "@/components/PageHeader";
import { StatusBanner } from "@/components/StatusBanner";
import { SkillBadge } from "@/components/SkillBadge";
import { SkillIcon } from "@/components/SkillIcon";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ProfileSkeleton } from "@/components/Skeletons";
import { StateSwitch, useViewState } from "@/components/ViewState";
import { EmptyState } from "@/components/EmptyState";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Profile() {
  const state = useViewState();
  const [visible, setVisible] = useState(currentWorker.visibleToEmployers);
  const w = currentWorker;
  return (
    <>
      <PageHeader title="My profile" />
      <StateSwitch state={state} loading={<ProfileSkeleton />} empty={<EmptyState icon={UserRound} title="Your profile is empty" text="Add your photo and main skill to start." />}>
        <div className="space-y-6 p-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
              {w.photoUrl ? <img src={w.photoUrl} alt="" className="h-32 w-32 rounded-full object-cover" /> : (
                <div className="grid h-32 w-32 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound className="h-16 w-16" /></div>
              )}
              <button type="button" aria-label="Change photo" onClick={() => toast("Open camera")} className="absolute bottom-0 right-0 grid h-12 w-12 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground">
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-2xl font-bold">{w.name}</h2>
            <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{w.city}, {w.region}</p>
          </div>

          <label className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            Preview: visible banner <Switch checked={visible} onCheckedChange={setVisible} />
          </label>
          <StatusBanner visible={visible} checklist={[
            { label: "Add a photo", done: !w.missing.includes("photo") },
            { label: "Add a short bio", done: !w.missing.includes("bio") },
            { label: "Choose your main skill", done: true },
          ]} />

          <section className="space-y-2">
            <h3 className="text-lg font-bold">About me</h3>
            <p className={w.bio ? "" : "text-muted-foreground"}>{w.bio || "No bio yet. Tell employers about your work."}</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold">Main skill</h3>
            <Link to="/worker/skill" className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-secondary p-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground"><SkillIcon slug={w.mainSkill.skillType.slug} className="h-8 w-8" /></div>
              <div className="flex-1">
                <p className="text-lg font-bold">{w.mainSkill.skillType.nameEn}</p>
                <p className="text-sm text-muted-foreground">{w.mainSkill.yearsOfExperience} years</p>
              </div>
              <SkillBadge status={w.mainSkill.verified ? "verified" : "pending"} />
            </Link>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold">Other skills</h3>
            <ul className="space-y-2">
              {w.otherSkills.map((s) => (
                <li key={s.skillType.id} className="flex items-center gap-3 rounded-2xl border p-3">
                  <SkillIcon slug={s.skillType.slug} className="text-primary" />
                  <span className="flex-1"><b>{s.skillType.nameEn}</b> · {s.yearsOfExperience} yrs</span>
                  <SkillBadge status="unverified" />
                </li>
              ))}
            </ul>
            <Link to="/worker/skills/add" className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed font-bold text-primary"><Plus className="h-5 w-5" />Add other skill</Link>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold">My work photos</h3>
            <PhotoGrid photos={w.portfolio} editable />
          </section>

          <Link to="/worker/ratings" className="flex h-14 items-center gap-3 rounded-2xl border px-4 font-bold"><Star className="h-5 w-5 fill-star text-star" />My ratings · {w.rating.average.toFixed(1)}</Link>
          <Link to="/worker/profile/edit" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground"><Pencil className="h-5 w-5" />Edit profile</Link>
        </div>
      </StateSwitch>
    </>
  );
}
