import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/WorkerDetail";

export const Route = createFileRoute("/employer/workers/$id")({
  head: () => ({ meta: [{ title: "Worker · SkillsPass Rwanda" }, { name: "description", content: "Worker — SkillsPass Rwanda" }, { property: "og:title", content: "Worker · SkillsPass Rwanda" }, { property: "og:description", content: "Worker — SkillsPass Rwanda" }] }),
  component: C,
});

function C() { return <Page id={Route.useParams().id} />; }
