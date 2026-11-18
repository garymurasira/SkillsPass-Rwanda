import { createFileRoute } from "@tanstack/react-router";
import Otp from "@/pages/public/Otp";

export const Route = createFileRoute("/otp")({
  head: () => ({ meta: [{ title: "Enter code · SkillsPass Rwanda" }, { name: "description", content: "Enter your SMS code" }, { property: "og:title", content: "Enter code" }, { property: "og:description", content: "Enter your SMS code" }] }),
  component: Otp,
});
