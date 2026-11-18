import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/Jobs";

export const Route = createFileRoute("/worker/jobs")({
  head: () => ({ meta: [{ title: "My jobs · SkillsPass Rwanda" }, { name: "description", content: "My jobs — SkillsPass Rwanda" }, { property: "og:title", content: "My jobs · SkillsPass Rwanda" }, { property: "og:description", content: "My jobs — SkillsPass Rwanda" }] }),
  component: Page,
});
