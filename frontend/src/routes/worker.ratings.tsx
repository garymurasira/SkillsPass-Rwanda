import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/Ratings";

export const Route = createFileRoute("/worker/ratings")({
  head: () => ({ meta: [{ title: "My ratings · SkillsPass Rwanda" }, { name: "description", content: "My ratings — SkillsPass Rwanda" }, { property: "og:title", content: "My ratings · SkillsPass Rwanda" }, { property: "og:description", content: "My ratings — SkillsPass Rwanda" }] }),
  component: Page,
});
