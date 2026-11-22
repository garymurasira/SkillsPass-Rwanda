import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  addFavorite, getEmployerProfile, getWorkerDetail, listFavorites, removeFavorite, searchWorkers, updateEmployerProfile,
  type EmployerUpdate, type SearchFilters, type WorkerCard, type WorkerDetail, type WorkerPage,
} from "../api/employer";

export const employerKeys = {
  all: ["employer"] as const,
  search: (f: SearchFilters) => ["employer", "search", f] as const,
  worker: (id: string) => ["employer", "worker", id] as const,
  favorites: ["employer", "favorites"] as const,
  me: ["employer", "me"] as const,
};

const nextOffset = (last: WorkerPage) => (last.offset + last.limit < last.total ? last.offset + last.limit : undefined);

export const useWorkerSearch = (filters: SearchFilters) =>
  useInfiniteQuery({
    queryKey: employerKeys.search(filters),
    queryFn: ({ pageParam, signal }) => searchWorkers(filters, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  });

export const useFavorites = () =>
  useInfiniteQuery({
    queryKey: employerKeys.favorites,
    queryFn: ({ pageParam, signal }) => listFavorites(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  });

export const useWorkerDetail = (id: string) =>
  useQuery({ queryKey: employerKeys.worker(id), queryFn: ({ signal }) => getWorkerDetail(id, signal) });

// ── Favorites: the heart flips instantly everywhere, then the server confirms ──

export type Cached = InfiniteData<WorkerPage> | WorkerDetail | undefined;

export function patchFavorite(data: Cached, workerId: string, isFavorite: boolean): Cached {
  if (!data) return data;
  if ("pages" in data) {
    return { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((w: WorkerCard) => (w.id === workerId ? { ...w, isFavorite } : w)) })) };
  }
  return data.id === workerId ? { ...data, isFavorite } : data;
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, favorite }: { workerId: string; favorite: boolean }) =>
      favorite ? addFavorite(workerId) : removeFavorite(workerId),
    onMutate: ({ workerId, favorite }) => {
      // Search results and the worker page change at once. The favorites list is refetched below,
      // because a removed worker should leave it.
      qc.setQueriesData<Cached>({ queryKey: ["employer", "search"] }, (d) => patchFavorite(d, workerId, favorite));
      qc.setQueryData<Cached>(employerKeys.worker(workerId), (d) => patchFavorite(d, workerId, favorite));
    },
    // Success or failure, the server is the truth: refetch what the heart touches.
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: employerKeys.favorites });
      void qc.invalidateQueries({ queryKey: ["employer", "search"] });
      void qc.invalidateQueries({ queryKey: ["employer", "worker"] });
    },
  });
}

// ── Company profile ──

export const useEmployerProfile = () =>
  useQuery({ queryKey: employerKeys.me, queryFn: ({ signal }) => getEmployerProfile(signal) });

export function useUpdateEmployerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: EmployerUpdate) => updateEmployerProfile(patch),
    onSuccess: (profile) => qc.setQueryData(employerKeys.me, profile),
  });
}
