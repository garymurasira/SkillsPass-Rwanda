import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, MapPin, Pencil, Plus, Star, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBanner } from "@/components/StatusBanner";
import { SkillBadge } from "@/components/SkillBadge";
import { SkillIcon } from "@/components/SkillIcon";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ProfileSkeleton } from "@/components/Skeletons";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { assetUrl } from "@/lib/api/config";
import { errorMessage } from "@/lib/api/error-messages";
import { ApiError } from "@/lib/api/errors";
import type { SkillStatus } from "@/lib/api/worker";
import { prepareImage } from "@/lib/image";
import {
  useAddPortfolioPhoto, useMyProfile, useRemoveOtherSkill, useRemovePortfolioPhoto, useSetProfilePhoto,
} from "@/lib/queries/worker";

const badgeFor = (s: SkillStatus) => (s === "VERIFIED" ? "verified" : s === "PENDING" ? "pending" : "unverified");

export default function Profile() {
  const { data: w, isPending, isError, error, refetch } = useMyProfile();
  const setPhoto = useSetProfilePhoto();
  const addPhoto = useAddPortfolioPhoto();
  const removePhoto = useRemovePortfolioPhoto();
  const removeSkill = useRemoveOtherSkill();
  const photoInput = useRef<HTMLInputElement>(null);
  const [skillToRemove, setSkillToRemove] = useState<{ id: string; name: string } | null>(null);
  const [photoToRemove, setPhotoToRemove] = useState<string | null>(null);

  if (isPending) return (<><PageHeader title="My profile" /><ProfileSkeleton /></>);
  if (isError) return (<><PageHeader title="My profile" /><ErrorRetry text={errorMessage(error)} onRetry={() => void refetch()} /></>);

  const upload = async (file: File, send: (blob: Blob) => Promise<unknown>): Promise<void> => {
    if (!file.type.startsWith("image/")) {
      toast.error(errorMessage(new ApiError(400, "INVALID_IMAGE")));
      return;
    }
    try {
      await send(await prepareImage(file));
      toast.success("Photo saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const main = w.mainSkill;
  const photo = assetUrl(w.photoUrl);

  return (
    <>
      <PageHeader title="My profile" />
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="relative">
            {photo ? <img src={photo} alt="" className="h-32 w-32 rounded-full object-cover" /> : (
              <div className="grid h-32 w-32 place-items-center rounded-full bg-muted text-muted-foreground"><UserRound className="h-16 w-16" /></div>
            )}
            <input ref={photoInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f, setPhoto.mutateAsync); }} />
            <button type="button" aria-label="Change photo" disabled={setPhoto.isPending} onClick={() => photoInput.current?.click()}
              className="absolute bottom-0 right-0 grid h-12 w-12 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground disabled:opacity-60">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold">{w.name}</h2>
          <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{w.city}, {w.region}</p>
        </div>

        <StatusBanner visible={w.visibleToEmployers} checklist={[
          { label: "Add a photo", done: !w.missing.includes("photo") },
          { label: "Add a short bio", done: !w.missing.includes("bio") },
          { label: "Choose your main skill", done: main !== null },
          { label: "Get your main skill verified", done: main?.status === "VERIFIED" },
        ]} />

        <section className="space-y-2">
          <h3 className="text-lg font-bold">About me</h3>
          <p className={w.bio ? "" : "text-muted-foreground"}>{w.bio || "No bio yet. Tell employers about your work."}</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-bold">Main skill</h3>
          {main ? (
            <Link to="/worker/skill" className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-secondary p-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground"><SkillIcon slug={main.skillType.slug} className="h-8 w-8" /></div>
              <div className="flex-1">
                <p className="text-lg font-bold">{main.skillType.nameEn}</p>
                <p className="text-sm text-muted-foreground">{main.yearsOfExperience} years</p>
                {main.flaggedForReview && <p className="text-sm text-muted-foreground">Staff will review your new experience.</p>}
              </div>
              <SkillBadge status={badgeFor(main.status)} />
            </Link>
          ) : (
            <Link to="/worker/skill" className="flex h-20 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary text-lg font-bold text-primary">
              <Plus className="h-6 w-6" />Choose your main skill
            </Link>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-bold">Other skills</h3>
          <ul className="space-y-2">
            {w.otherSkills.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl border p-3">
                <SkillIcon slug={s.skillType.slug} className="text-primary" />
                <span className="flex-1"><b>{s.skillType.nameEn}</b> · {s.yearsOfExperience} yrs</span>
                <SkillBadge status="unverified" />
                <button type="button" aria-label={`Remove ${s.skillType.nameEn}`} onClick={() => setSkillToRemove({ id: s.id, name: s.skillType.nameEn })}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
              </li>
            ))}
          </ul>
          <Link to="/worker/skills/add" className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed font-bold text-primary"><Plus className="h-5 w-5" />Add other skill</Link>
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-bold">My work photos</h3>
          <PhotoGrid photos={w.portfolio} editable busy={addPhoto.isPending || removePhoto.isPending}
            onAddFile={(f) => void upload(f, addPhoto.mutateAsync)} onDelete={setPhotoToRemove} />
        </section>

        <Link to="/worker/ratings" className="flex h-14 items-center gap-3 rounded-2xl border px-4 font-bold"><Star className="h-5 w-5 fill-star text-star" />My ratings</Link>
        <Link to="/worker/profile/edit" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground"><Pencil className="h-5 w-5" />Edit profile</Link>
      </div>

      <ConfirmDialog
        open={skillToRemove !== null}
        onOpenChange={(open) => !open && setSkillToRemove(null)}
        title={`Remove ${skillToRemove?.name ?? "skill"}?`}
        text="This skill will no longer show on your profile."
        confirmLabel="Yes, remove it"
        cancelLabel="Keep it"
        onConfirm={() => skillToRemove && removeSkill.mutate(skillToRemove.id, { onError: (e) => toast.error(errorMessage(e)) })}
      />
      <ConfirmDialog
        open={photoToRemove !== null}
        onOpenChange={(open) => !open && setPhotoToRemove(null)}
        title="Delete this photo?"
        text="It will be removed from your profile."
        confirmLabel="Yes, delete it"
        cancelLabel="Keep it"
        onConfirm={() => photoToRemove && removePhoto.mutate(photoToRemove, { onError: (e) => toast.error(errorMessage(e)) })}
      />
    </>
  );
}
