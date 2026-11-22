import { Link } from "@tanstack/react-router";
import { Heart, MapPin, UserRound } from "lucide-react";
import { toast } from "sonner";
import { assetUrl } from "@/lib/api/config";
import { errorMessage } from "@/lib/api/error-messages";
import type { WorkerCard as WorkerCardData } from "@/lib/api/employer";
import { useToggleFavorite } from "@/lib/queries/employer";
import { SkillBadge } from "./SkillBadge";
import { StarRating } from "./StarRating";
import { SkillIcon } from "./SkillIcon";

/** The heart. The state comes from the data, so it is always in step with every other screen. */
export function HeartToggle({ workerId, isFavorite, className = "" }: { workerId: string; isFavorite: boolean; className?: string }) {
  const toggle = useToggleFavorite();
  return (
    <button type="button" aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={isFavorite}
      onClick={(e) => {
        e.preventDefault(); // the card around it is a link
        toggle.mutate({ workerId, favorite: !isFavorite }, { onError: (err) => toast.error(errorMessage(err)) });
      }}
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border bg-card ${className}`}>
      <Heart className={`h-6 w-6 ${isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
    </button>
  );
}

export function WorkerCard({ worker }: { worker: WorkerCardData }) {
  const photo = assetUrl(worker.photoUrl);
  return (
    <Link to="/employer/workers/$id" params={{ id: worker.id }} className="flex gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-primary">
      {photo ? (
        <img src={photo} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><UserRound className="h-10 w-10" /></div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 truncate font-bold">{worker.name}</p>
          <HeartToggle workerId={worker.id} isFavorite={worker.isFavorite} className="-mr-1 -mt-1 h-10 w-10 border-0" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <SkillIcon slug={worker.mainSkill.slug} className="h-4 w-4 text-primary" />
          <span className="font-bold">{worker.mainSkill.nameEn}</span>
          {worker.mainSkill.verified && <SkillBadge status="verified" className="px-2 py-0.5 text-xs" />}
        </div>
        <p className="text-sm text-muted-foreground">{worker.mainSkill.yearsOfExperience} years</p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{worker.city}, {worker.region}</p>
        <StarRating value={worker.rating.average ?? 0} count={worker.rating.count} />
      </div>
    </Link>
  );
}
