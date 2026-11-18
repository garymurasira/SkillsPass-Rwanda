import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/public/RegisterWorker";

export const Route = createFileRoute("/register/worker")({
  head: () => ({ meta: [{ title: "Register as worker · SkillsPass Rwanda" }, { name: "description", content: "Register as worker — SkillsPass Rwanda" }, { property: "og:title", content: "Register as worker · SkillsPass Rwanda" }, { property: "og:description", content: "Register as worker — SkillsPass Rwanda" }] }),
  component: Page,
});
