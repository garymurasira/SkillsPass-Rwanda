import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/EditProfile";

export const Route = createFileRoute("/worker/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile · SkillsPass Rwanda" }, { name: "description", content: "Edit profile — SkillsPass Rwanda" }, { property: "og:title", content: "Edit profile · SkillsPass Rwanda" }, { property: "og:description", content: "Edit profile — SkillsPass Rwanda" }] }),
  component: Page,
});
