import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/employer/Favorites";

export const Route = createFileRoute("/employer/favorites")({
  head: () => ({ meta: [{ title: "Favorites · SkillsPass Rwanda" }, { name: "description", content: "Favorites — SkillsPass Rwanda" }, { property: "og:title", content: "Favorites · SkillsPass Rwanda" }, { property: "og:description", content: "Favorites — SkillsPass Rwanda" }] }),
  component: Page,
});
