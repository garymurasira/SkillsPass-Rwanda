import { api } from "./client";

// Hand-pinned shapes (see backend/src/modules/jobs-ratings/*.ts).

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

export interface JobPage {
  items: Job[];
  total: number;
  limit: number;
  offset: number;
}

export const JOBS_PAGE_SIZE = 20;

/** The signed-in person's own jobs, newest first. Works for employers and workers. */
export const listJobs = (status: JobStatus | undefined, offset: number, signal?: AbortSignal) =>
  api.get<JobPage>("/jobs", { query: { status, limit: JOBS_PAGE_SIZE, offset }, ...(signal ? { signal } : {}) });

/**
 * Two steps on one endpoint (FR 5.5): the employer marks the job done, then the worker confirms.
 * The same call from the other side is rejected until the first step happened.
 */
export const completeJob = (jobId: string) => api.post<Job>(`/jobs/${jobId}/complete`);

// ── Ratings ──

export interface CreatedRating {
  id: string;
  jobId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}

/** Only for a job the worker has confirmed, and only once per job (BR 3). */
export const createRating = (jobId: string, stars: number, comment?: string) =>
  api.post<CreatedRating>("/ratings", { jobId, stars, ...(comment?.trim() ? { comment: comment.trim() } : {}) });

export interface MyRatings {
  average: number | null;
  count: number;
  items: { stars: number; comment: string | null; createdAt: string; employer: string }[];
  limit: number;
  offset: number;
}

export const listMyRatings = (offset: number, signal?: AbortSignal) =>
  api.get<MyRatings>("/workers/me/ratings", { query: { limit: JOBS_PAGE_SIZE, offset }, ...(signal ? { signal } : {}) });
