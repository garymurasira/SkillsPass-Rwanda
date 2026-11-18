import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/Flagged";

export const Route = createFileRoute("/admin/flagged")({
  head: () => ({ meta: [{ title: "Flagged skills · SkillsPass Rwanda" }, { name: "description", content: "Flagged skills — SkillsPass Rwanda" }, { property: "og:title", content: "Flagged skills · SkillsPass Rwanda" }, { property: "og:description", content: "Flagged skills — SkillsPass Rwanda" }] }),
  component: Page,
});
