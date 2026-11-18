import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/ChangePhone";

export const Route = createFileRoute("/worker/settings/phone")({
  head: () => ({ meta: [{ title: "Change phone · SkillsPass Rwanda" }, { name: "description", content: "Change phone — SkillsPass Rwanda" }, { property: "og:title", content: "Change phone · SkillsPass Rwanda" }, { property: "og:description", content: "Change phone — SkillsPass Rwanda" }] }),
  component: C,
});

function C() { return <Page backTo="/worker/settings" />; }
