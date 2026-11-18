import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/public/Login";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · SkillsPass Rwanda" }, { name: "description", content: "Sign in — SkillsPass Rwanda" }, { property: "og:title", content: "Sign in · SkillsPass Rwanda" }, { property: "og:description", content: "Sign in — SkillsPass Rwanda" }] }),
  component: Page,
});
