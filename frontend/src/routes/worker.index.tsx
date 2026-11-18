import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/Profile";

export const Route = createFileRoute("/worker/")({
  head: () => ({ meta: [{ title: "My profile · SkillsPass Rwanda" }, { name: "description", content: "My profile — SkillsPass Rwanda" }, { property: "og:title", content: "My profile · SkillsPass Rwanda" }, { property: "og:description", content: "My profile — SkillsPass Rwanda" }] }),
  component: Page,
});
