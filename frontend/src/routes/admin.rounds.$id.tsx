import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/RoundDetail";

export const Route = createFileRoute("/admin/rounds/$id")({
  head: () => ({ meta: [{ title: "Round · SkillsPass Rwanda" }, { name: "description", content: "Round — SkillsPass Rwanda" }, { property: "og:title", content: "Round · SkillsPass Rwanda" }, { property: "og:description", content: "Round — SkillsPass Rwanda" }] }),
  component: C,
});

function C() { return <Page id={Route.useParams().id} />; }
