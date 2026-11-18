import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/Find";

export const Route = createFileRoute("/employer/")({
  head: () => ({ meta: [{ title: "Find workers · SkillsPass Rwanda" }, { name: "description", content: "Find workers — SkillsPass Rwanda" }, { property: "og:title", content: "Find workers · SkillsPass Rwanda" }, { property: "og:description", content: "Find workers — SkillsPass Rwanda" }] }),
  component: Page,
});
