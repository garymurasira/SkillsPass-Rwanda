import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/Settings";

export const Route = createFileRoute("/worker/settings/")({
  head: () => ({ meta: [{ title: "Settings · SkillsPass Rwanda" }, { name: "description", content: "Settings — SkillsPass Rwanda" }, { property: "og:title", content: "Settings · SkillsPass Rwanda" }, { property: "og:description", content: "Settings — SkillsPass Rwanda" }] }),
  component: Page,
});
