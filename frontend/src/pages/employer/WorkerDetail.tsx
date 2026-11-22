import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { MapPin, MessageCircle, Phone, Play, UserRound, UserX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SkillBadge } from "@/components/SkillBadge";
import { SkillIcon } from "@/components/SkillIcon";
import { StarRating } from "@/components/StarRating";
import { PhotoGrid } from "@/components/PhotoGrid";
import { HeartToggle } from "@/components/WorkerCard";
import { ReviewList } from "@/components/ReviewList";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry } from "@/components/ErrorRetry";
import { ProfileSkeleton } from "@/components/Skeletons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { assetUrl } from "@/lib/api/config";
import { errorMessage } from "@/lib/api/error-messages";
import { hasErrorCode } from "@/lib/api/errors";
import { createJob } from "@/lib/api/jobs";
import { useWorkerDetail } from "@/lib/queries/employer";

export default function WorkerDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const q = useWorkerDetail(id);
  const [viewer, setViewer] = useState<number | null>(null);
  const startJob = useMutation({
    mutationFn: () => createJob(id),
    onSuccess: () => {
      toast.success("Job started");
      navigate({ to: "/employer/jobs" });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (q.isPending) return (<><PageHeader title="Worker" back /><ProfileSkeleton /></>);

  if (q.isError) {
    // A worker who lost verification (or never had it) looks the same as one who doesn't exist.
    if (hasErrorCode(q.error, "WORKER_NOT_FOUND", "NOT_FOUND")) {
      return (
        <>
          <PageHeader title="Worker" back />
          <EmptyState icon={UserX} title="This worker is no longer available" text="They may have changed their skill or left SkillsPass."
            action={<Link to="/employer" className="flex h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground">Find other workers</Link>} />
        </>
      );
    }
    return (<><PageHeader title="Worker" back /><ErrorRetry text={errorMessage(q.error)} onRetry={() => void q.refetch()} /></>);
  }

  const w = q.data;
  const photo = assetUrl(w.photoUrl);

  return (
    <>
      <PageHeader title={w.name} back />
      <div className="flex-1 p-4 md:grid md:grid-cols-[320px_1fr] md:gap-8 md:p-6">
        <div className="space-y-4 md:sticky md:top-20 md:self-start">
          {photo ? (
            <img src={photo} alt="" className="aspect-square w-full rounded-3xl object-cover md:max-w-xs" />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded-3xl bg-muted text-muted-foreground md:max-w-xs"><UserRound className="h-20 w-20" /></div>
          )}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{w.name}</h2>
            <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{w.city}, {w.region}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
            <SkillIcon slug={w.mainSkill.skillType.slug} className="h-8 w-8 text-primary" />
            <div className="flex-1"><p className="font-bold">{w.mainSkill.skillType.nameEn}</p><p className="text-sm text-muted-foreground">{w.mainSkill.yearsOfExperience} years</p></div>
            {w.mainSkill.verified && <SkillBadge status="verified" />}
          </div>
          <div className="sticky bottom-16 z-20 -mx-4 flex gap-2 border-t bg-background p-3 md:static md:mx-0 md:flex-wrap md:border-0 md:p-0">
            <button type="button" onClick={() => navigate({ to: "/employer/messages/$id", params: { id: w.id } })} className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary font-bold text-primary-foreground md:basis-full">
              <MessageCircle className="h-5 w-5" />Send message
            </button>
            <button type="button" disabled={startJob.isPending} onClick={() => startJob.mutate()} className="flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-primary font-bold text-primary disabled:opacity-60">
              <Play className="h-5 w-5" />{startJob.isPending ? "Starting…" : "Start job"}
            </button>
            {w.phone && (
              <a href={`tel:${w.phone.replace(/\s/g, "")}`} aria-label="Call" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Phone className="h-5 w-5" /></a>
            )}
            <HeartToggle workerId={w.id} isFavorite={w.isFavorite} />
          </div>
        </div>
        <div className="mt-6 space-y-6 md:mt-0">
          <section className="space-y-2"><h3 className="text-lg font-bold">About</h3><p className={w.bio ? "" : "text-muted-foreground"}>{w.bio || "No bio yet."}</p></section>
          <section className="space-y-2">
            <h3 className="text-lg font-bold">Work photos</h3>
            {w.portfolio.length > 0 ? <PhotoGrid photos={w.portfolio} onOpen={setViewer} /> : <p className="text-muted-foreground">No work photos yet.</p>}
          </section>
          {w.otherSkills.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-lg font-bold">Other skills</h3>
              {w.otherSkills.map((s) => (
                <div key={s.skillType.id} className="flex items-center gap-3 rounded-2xl border p-3">
                  <SkillIcon slug={s.skillType.slug} className="text-primary" /><span className="flex-1"><b>{s.skillType.nameEn}</b> · {s.yearsOfExperience} yrs</span><SkillBadge status="unverified" />
                </div>
              ))}
            </section>
          )}
          <section className="space-y-3">
            <h3 className="text-lg font-bold">Ratings</h3>
            {w.rating.count > 0 && w.rating.average !== null ? (
              <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><span className="text-3xl font-bold">{w.rating.average.toFixed(1)}</span><StarRating value={w.rating.average} /><span className="text-muted-foreground">{w.rating.count} {w.rating.count === 1 ? "rating" : "ratings"}</span></div>
            ) : <p className="text-muted-foreground">No ratings yet</p>}
            <ReviewList reviews={w.reviews} />
          </section>
        </div>
      </div>
      <Dialog open={viewer !== null} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="h-[100dvh] max-w-none place-items-center rounded-none border-0 bg-foreground p-2 sm:max-w-none">
          <DialogTitle className="sr-only">Work photo</DialogTitle>
          {viewer !== null && <img src={assetUrl(w.portfolio[viewer]?.url) ?? ""} alt="" className="max-h-full max-w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
