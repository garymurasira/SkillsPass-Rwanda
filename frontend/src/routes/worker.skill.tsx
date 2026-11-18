import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/ChooseSkill";

export const Route = createFileRoute("/worker/skill")({
  head: () => ({ meta: [{ title: "Choose main skill · SkillsPass Rwanda" }, { name: "description", content: "Choose main skill — SkillsPass Rwanda" }, { property: "og:title", content: "Choose main skill · SkillsPass Rwanda" }, { property: "og:description", content: "Choose main skill — SkillsPass Rwanda" }] }),
  component: Page,
});
