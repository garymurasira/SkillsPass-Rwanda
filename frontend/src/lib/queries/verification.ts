import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ROUNDS_PAGE_SIZE, clearFlag, getRound, getVerificationStatus, listFlaggedSkills, listRounds, recordResult,
  submitReferences, type ReferenceInput, type ReferenceResult, type RoundStatus,
} from "../api/verification";
import { workerKeys } from "./worker";

export const verificationKeys = {
  mine: ["verification", "me"] as const,
  rounds: (status: RoundStatus) => ["admin", "rounds", status] as const,
  allRounds: ["admin", "rounds"] as const,
  round: (id: string) => ["admin", "round", id] as const,
  flagged: ["admin", "flagged"] as const,
};

// ── Worker ──

export const useMyVerification = () =>
  useQuery({ queryKey: verificationKeys.mine, queryFn: ({ signal }) => getVerificationStatus(signal) });

export function useSubmitReferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (refs: ReferenceInput[]) => submitReferences(refs),
    onSuccess: (status) => {
      qc.setQueryData(verificationKeys.mine, status);
      void qc.invalidateQueries({ queryKey: workerKeys.me }); // the profile shows the skill's status
    },
  });
}

// ── Admin ──

/** Pages of 20 rounds; `hasNextPage` is true while the last page came back full. */
export const useRounds = (status: RoundStatus) =>
  useInfiniteQuery({
    queryKey: verificationKeys.rounds(status),
    queryFn: ({ pageParam, signal }) => listRounds(status, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === ROUNDS_PAGE_SIZE ? all.length * ROUNDS_PAGE_SIZE : undefined),
  });

export const useRound = (id: string) =>
  useQuery({ queryKey: verificationKeys.round(id), queryFn: ({ signal }) => getRound(id, signal) });

export function useRecordResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ referenceId, result }: { referenceId: string; result: Exclude<ReferenceResult, "PENDING"> }) =>
      recordResult(referenceId, result),
    onSuccess: (round) => {
      qc.setQueryData(verificationKeys.round(round.id), round);
      // The round may have moved from Open to Verified/Not verified, so every list is stale.
      void qc.invalidateQueries({ queryKey: verificationKeys.allRounds });
    },
  });
}

export const useFlaggedSkills = () =>
  useQuery({ queryKey: verificationKeys.flagged, queryFn: ({ signal }) => listFlaggedSkills(signal) });

export function useClearFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => clearFlag(skillId),
    onSuccess: () => qc.invalidateQueries({ queryKey: verificationKeys.flagged }),
  });
}
