import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import WorkerJobs from "./Jobs";
import type { Job } from "@/lib/api/jobs";

vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ history: { back: vi.fn() } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const complete = vi.fn();
let jobs: Job[] = [];
vi.mock("@/lib/queries/jobs", () => ({
  useJobs: () => ({ data: { pages: [{ items: jobs, total: jobs.length, limit: 20, offset: 0 }] }, isPending: false, isError: false, hasNextPage: false }),
  useCompleteJob: () => ({ mutate: complete, isPending: false }),
}));

const job = (over: Partial<Job>): Job => ({
  id: "j1", status: "IN_PROGRESS", createdAt: "2026-11-01T00:00:00Z", employerMarkedAt: null, workerConfirmedAt: null,
  worker: { id: "w1", name: "Me" }, employer: { id: "e1", companyName: "BuildCo" }, rating: null, canRate: false, ...over,
});

beforeEach(() => complete.mockReset());

describe("Worker jobs", () => {
  it("names the company and has nothing to confirm until the employer marks the job", () => {
    jobs = [job({})];
    render(<WorkerJobs />);
    expect(screen.getByText("BuildCo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm job completed" })).not.toBeInTheDocument();
  });

  it("confirms a marked job only after the worker says yes", async () => {
    jobs = [job({ status: "EMPLOYER_MARKED" })];
    render(<WorkerJobs />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm job completed" }));
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Yes, it is finished" }));
    expect(complete).toHaveBeenCalledWith("j1", expect.anything());
  });

  it("shows the empty state when there are no jobs", () => {
    jobs = [];
    render(<WorkerJobs />);
    expect(screen.getByText("No jobs yet")).toBeInTheDocument();
  });
});
