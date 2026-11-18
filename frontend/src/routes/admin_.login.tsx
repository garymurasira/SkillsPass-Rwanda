import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/public/AdminLogin";

export const Route = createFileRoute("/admin_/login")({
  head: () => ({ meta: [{ title: "Staff sign in · SkillsPass Rwanda" }, { name: "description", content: "Staff sign in — SkillsPass Rwanda" }, { property: "og:title", content: "Staff sign in · SkillsPass Rwanda" }, { property: "og:description", content: "Staff sign in — SkillsPass Rwanda" }] }),
  component: Page,
});
