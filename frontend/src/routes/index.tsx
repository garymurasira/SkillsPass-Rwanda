import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/public/Landing";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Verified skills for Rwanda · SkillsPass Rwanda" }, { name: "description", content: "Verified skills for Rwanda — SkillsPass Rwanda" }, { property: "og:title", content: "Verified skills for Rwanda · SkillsPass Rwanda" }, { property: "og:description", content: "Verified skills for Rwanda — SkillsPass Rwanda" }] }),
  component: Page,
});
