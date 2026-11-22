import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/Find";
import type { SearchFilters } from "@/lib/api/employer";

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);

// The filters live in the address (?skill=electrician&region=Kigali), so going to a worker and
// pressing Back brings the same search back instead of resetting it.
export const Route = createFileRoute("/employer/")({
  validateSearch: (s: Record<string, unknown>): SearchFilters => {
    const out: SearchFilters = {};
    const skill = text(s["skill"]), region = text(s["region"]), city = text(s["city"]);
    const rating = Number(s["minRating"]);
    if (skill) out.skill = skill;
    if (region) out.region = region;
    if (city) out.city = city;
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) out.minRating = rating;
    return out;
  },
  head: () => ({ meta: [{ title: "Find workers · SkillsPass Rwanda" }, { name: "description", content: "Find workers — SkillsPass Rwanda" }, { property: "og:title", content: "Find workers · SkillsPass Rwanda" }, { property: "og:description", content: "Find workers — SkillsPass Rwanda" }] }),
  component: Page,
});
