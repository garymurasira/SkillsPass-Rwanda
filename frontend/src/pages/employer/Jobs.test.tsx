import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EmployerJobs from "./Jobs";
import type { Job } from "@/lib/api/jobs";

vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ history: { back: vi.fn() } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const complete = vi.fn();
const rate = vi.fn();
let jobs: Job[] = [];
vi.mock("@/lib/queries/jobs", () => ({
  useJobs: () => ({ data: { pages: [{ items: jobs, total: jobs.length, limit: 20, offset: 0 }] }, isPending: false, isError: false, hasNextPage: false }),
  useCompleteJob: () => ({ mutate: complete, isPending: false }),
  useRateJob: () => ({ mutate: rate, isPending: false }),
}));

const job = (over: Partial<Job>): Job => ({
  id: "j1", status: "IN_PROGRESS", createdAt: "2026-11-01T00:00:00Z", employerMarkedAt: null, workerConfirmedAt: null,
  worker: { id: "w1", name: "Eric Habimana" }, employer: { id: "e1", companyName: "BuildCo" }, rating: null, canRate: false, ...over,
});

beforeEach(() => { complete.mockReset(); rate.mockReset(); });

describe("Employer jobs", () => {
  it("offers 'Mark as completed' on an in-progress job, after asking to be sure", async () => {
    jobs = [job({})];
    render(<EmployerJobs />);
    expect(screen.getByText("Eric Habimana")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark as completed" }));
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Yes, mark as completed" }));
    expect(complete).toHaveBeenCalledWith("j1", expect.anything());
  });

  it("only says 'waiting' once the employer has marked the job", () => {
    jobs = [job({ status: "EMPLOYER_MARKED" })];
    render(<EmployerJobs />);
    expect(screen.getByText("Waiting for the worker to confirm.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as completed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rate this worker" })).not.toBeInTheDocument();
  });

  it("lets the employer rate a confirmed job, needing at least one star", async () => {
    jobs = [job({ status: "COMPLETED", canRate: true, workerConfirmedAt: "2026-11-05T00:00:00Z" })];
    render(<EmployerJobs />);
    fireEvent.click(screen.getByRole("button", { name: "Rate this worker" }));

    const submit = await screen.findByRole("button", { name: "Submit" });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "4 stars" }));
    fireEvent.change(screen.getByPlaceholderText("Comment (optional)"), { target: { value: "Good work" } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => expect(rate).toHaveBeenCalledTimes(1));
    expect(rate.mock.calls[0]![0]).toEqual({ jobId: "j1", stars: 4, comment: "Good work" });
  });

  it("shows the rating already given and hides the rate button", () => {
    jobs = [job({ status: "COMPLETED", canRate: false, rating: { stars: 5, comment: "Great", createdAt: "2026-11-06T00:00:00Z" } })];
    render(<EmployerJobs />);
    expect(screen.getByText("Great")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rate this worker" })).not.toBeInTheDocument();
  });
});
