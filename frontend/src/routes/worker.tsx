import { createFileRoute } from "@tanstack/react-router";
import { WorkerShell } from "@/components/layout/WorkerShell";

export const Route = createFileRoute("/worker")({ component: WorkerShell });
