import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/Queue";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Verification queue · SkillsPass Rwanda" }, { name: "description", content: "Verification queue — SkillsPass Rwanda" }, { property: "og:title", content: "Verification queue · SkillsPass Rwanda" }, { property: "og:description", content: "Verification queue — SkillsPass Rwanda" }] }),
  component: Page,
});
