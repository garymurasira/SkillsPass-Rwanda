import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/Verify";

export const Route = createFileRoute("/worker/verify")({
  head: () => ({ meta: [{ title: "Verify · SkillsPass Rwanda" }, { name: "description", content: "Verify — SkillsPass Rwanda" }, { property: "og:title", content: "Verify · SkillsPass Rwanda" }, { property: "og:description", content: "Verify — SkillsPass Rwanda" }] }),
  component: Page,
});
