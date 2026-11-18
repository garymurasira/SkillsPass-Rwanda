import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/Messages";

export const Route = createFileRoute("/employer/messages/")({
  head: () => ({ meta: [{ title: "Messages · SkillsPass Rwanda" }, { name: "description", content: "Messages — SkillsPass Rwanda" }, { property: "og:title", content: "Messages · SkillsPass Rwanda" }, { property: "og:description", content: "Messages — SkillsPass Rwanda" }] }),
  component: Page,
});
