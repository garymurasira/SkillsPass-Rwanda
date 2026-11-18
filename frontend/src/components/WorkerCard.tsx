import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MapPin } from "lucide-react";
import type { Worker } from "@/mock/data";
import { SkillBadge } from "./SkillBadge";
import { StarRating } from "./StarRating";
import { SkillIcon } from "./SkillIcon";

export function HeartToggle({ initial, className = "" }: { initial: boolean; className?: string }) {
  const [on, setOn] = useState(initial);
  return (
    <button type="button" aria-label={on ? "Remove from favorites" : "Add to favorites"} aria-pressed={on}
      onClick={(e) => { e.preventDefault(); setOn(!on); }}
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border bg-card ${className}`}>
      <Heart className={`h-6 w-6 ${on ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
    </button>
  );
}

export function WorkerCard({ worker }: { worker: Worker }) {
  return (
    <Link to="/employer/workers/$id" params={{ id: worker.id }} className="flex gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-primary">
      <img src={worker.photoUrl} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 truncate font-bold">{worker.name}</p>
          <HeartToggle initial={worker.isFavorite} className="-mr-1 -mt-1 h-10 w-10 border-0" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <SkillIcon slug={worker.mainSkill.skillType.slug} className="h-4 w-4 text-primary" />
          <span className="font-bold">{worker.mainSkill.skillType.nameEn}</span>
          <SkillBadge status="verified" className="px-2 py-0.5 text-xs" />
        </div>
        <p className="text-sm text-muted-foreground">{worker.mainSkill.yearsOfExperience} years</p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{worker.city}, {worker.region}</p>
        <StarRating value={worker.rating.average} count={worker.rating.count} />
      </div>
    </Link>
  );
}
