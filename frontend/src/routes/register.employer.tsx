import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/public/RegisterEmployer";

export const Route = createFileRoute("/register/employer")({
  head: () => ({ meta: [{ title: "Register as employer · SkillsPass Rwanda" }, { name: "description", content: "Register as employer — SkillsPass Rwanda" }, { property: "og:title", content: "Register as employer · SkillsPass Rwanda" }, { property: "og:description", content: "Register as employer — SkillsPass Rwanda" }] }),
  component: Page,
});
