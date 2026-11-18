import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/public/States";

export const Route = createFileRoute("/states")({
  head: () => ({ meta: [{ title: "Preview states · SkillsPass Rwanda" }, { name: "description", content: "Preview states — SkillsPass Rwanda" }, { property: "og:title", content: "Preview states · SkillsPass Rwanda" }, { property: "og:description", content: "Preview states — SkillsPass Rwanda" }] }),
  component: Page,
});
