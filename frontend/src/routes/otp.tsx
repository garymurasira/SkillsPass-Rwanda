import { createFileRoute } from "@tanstack/react-router";
import Otp from "@/pages/public/Otp";

export const Route = createFileRoute("/otp")({
  validateSearch: (s: Record<string, unknown>): { flow: "worker" | "employer" } => ({ flow: s["flow"] === "employer" ? "employer" : "worker" }),
  head: () => ({ meta: [{ title: "Enter code · SkillsPass Rwanda" }, { name: "description", content: "Enter your SMS code" }, { property: "og:title", content: "Enter code" }, { property: "og:description", content: "Enter your SMS code" }] }),
  component: C,
});

function C() { return <Otp flow={Route.useSearch().flow} />; }
