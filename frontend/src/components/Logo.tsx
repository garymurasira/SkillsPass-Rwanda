import { BadgeCheck } from "lucide-react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-primary ${size === "lg" ? "text-3xl" : "text-xl"}`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-accent"><BadgeCheck className="h-6 w-6" /></span>
      SkillsPass
    </span>
  );
}
