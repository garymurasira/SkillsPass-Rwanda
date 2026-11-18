import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeJob, createRating, listJobs, listMyRatings, type JobPage, type JobStatus, type MyRatings,
} from "../api/jobs";

export const jobKeys = {
  all: ["jobs"] as const,
  list: (status: JobStatus | undefined) => ["jobs", status ?? "all"] as const,
  myRatings: ["worker", "ratings"] as const,
};

const next = (last: { offset: number; limit: number; total: number }) =>
  last.offset + last.limit < last.total ? last.offset + last.limit : undefined;

/** The signed-in person's jobs, optionally only those with one status. */
export const useJobs = (status?: JobStatus) =>
  useInfiniteQuery({
    queryKey: jobKeys.list(status),
    queryFn: ({ pageParam, signal }): Promise<JobPage> => listJobs(status, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: next,
  });

/** Marks a job done (employer) or confirms it (worker). Every job list is out of date afterwards. */
export function useCompleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => completeJob(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useRateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, stars, comment }: { jobId: string; stars: number; comment?: string }) => createRating(jobId, stars, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: jobKeys.all });
      void qc.invalidateQueries({ queryKey: ["employer"] }); // worker averages shown in search and on profiles
      void qc.invalidateQueries({ queryKey: jobKeys.myRatings });
    },
  });
}

export const useMyRatings = () =>
  useInfiniteQuery({
    queryKey: jobKeys.myRatings,
    queryFn: ({ pageParam, signal }): Promise<MyRatings> => listMyRatings(pageParam, signal),
    initialPageParam: 0,
    // This endpoint reports the overall number of ratings as `count` (there is no `total`).
    getNextPageParam: (last) => next({ offset: last.offset, limit: last.limit, total: last.count }),
  });
