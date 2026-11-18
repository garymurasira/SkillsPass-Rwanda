import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/Jobs";

export const Route = createFileRoute("/employer/jobs")({
  head: () => ({ meta: [{ title: "Jobs · SkillsPass Rwanda" }, { name: "description", content: "Jobs — SkillsPass Rwanda" }, { property: "og:title", content: "Jobs · SkillsPass Rwanda" }, { property: "og:description", content: "Jobs — SkillsPass Rwanda" }] }),
  component: Page,
});
