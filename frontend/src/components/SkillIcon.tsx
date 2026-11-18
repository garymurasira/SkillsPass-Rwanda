import { Zap, Droplets, Hammer, Sun, Cog, BrickWall, Flame, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  electrician: Zap, plumber: Droplets, carpenter: Hammer, "solar-technician": Sun,
  mechanic: Cog, mason: BrickWall, welder: Flame,
};

export function SkillIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = icons[slug] ?? Hammer;
  return <Icon className={cn("h-6 w-6", className)} aria-hidden />;
}
