import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/Messages";

export const Route = createFileRoute("/employer/messages/$id")({
  head: () => ({ meta: [{ title: "Chat · SkillsPass Rwanda" }, { name: "description", content: "Chat — SkillsPass Rwanda" }, { property: "og:title", content: "Chat · SkillsPass Rwanda" }, { property: "og:description", content: "Chat — SkillsPass Rwanda" }] }),
  component: C,
});

function C() { return <Page activeId={Route.useParams().id} />; }
