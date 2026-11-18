import { createFileRoute } from "@tanstack/react-router";
import { EmployerShell } from "@/components/layout/EmployerShell";

export const Route = createFileRoute("/employer")({ component: EmployerShell });
