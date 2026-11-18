import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/AddSkill";

export const Route = createFileRoute("/worker/skills/add")({
  head: () => ({ meta: [{ title: "Add skill · SkillsPass Rwanda" }, { name: "description", content: "Add skill — SkillsPass Rwanda" }, { property: "og:title", content: "Add skill · SkillsPass Rwanda" }, { property: "og:description", content: "Add skill — SkillsPass Rwanda" }] }),
  component: Page,
});
