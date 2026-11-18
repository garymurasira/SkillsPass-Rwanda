import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/worker/Thread";

export const Route = createFileRoute("/worker/messages/$id")({
  head: () => ({ meta: [{ title: "Chat · SkillsPass Rwanda" }, { name: "description", content: "Chat — SkillsPass Rwanda" }, { property: "og:title", content: "Chat · SkillsPass Rwanda" }, { property: "og:description", content: "Chat — SkillsPass Rwanda" }] }),
  component: C,
});

function C() { return <Page id={Route.useParams().id} />; }
