import { api } from "./client";

// Stage 7 adds the rest of the job calls. Starting a job is here because the worker profile
// page (Stage 6) has the "Start job" button.

export type JobStatus = "IN_PROGRESS" | "EMPLOYER_MARKED" | "COMPLETED";

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: string;
  employerMarkedAt: string | null;
  workerConfirmedAt: string | null;
  worker: { id: string; name: string };
  employer: { id: string; companyName: string };
  rating: { stars: number; comment: string | null; createdAt: string } | null;
  /** True once the worker confirmed and the employer hasn't rated yet. */
  canRate: boolean;
}

/** An employer records a job with a worker they found here. Only one unfinished job per pair. */
export const createJob = (workerId: string) => api.post<Job>("/jobs", { workerId });
