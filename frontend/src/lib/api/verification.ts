import { api } from "./client";
import type { SkillStatus, SkillType } from "./worker";

// Hand-pinned shapes (see backend/src/modules/verification/*.ts).

export type ReferenceResult = "PENDING" | "CONFIRMED" | "NOT_CONFIRMED" | "UNREACHABLE";
export type RoundStatus = "OPEN" | "VERIFIED" | "NOT_VERIFIED";
export type Relationship = "Customer" | "Supervisor" | "Other";

// ── Worker ──

export interface ReferenceInput {
  name: string;
  phone: string;
  relationship: string;
}

/** What a worker sees of a reference. Phone numbers are never sent back to them. */
export interface WorkerReference {
  id: string;
  name: string;
  relationship: string;
  result: ReferenceResult;
  recordedAt: string | null;
}

export interface WorkerRound {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  createdAt: string;
  closedAt: string | null;
  references: WorkerReference[];
}

export interface VerificationStatus {
  mainSkill: { id: string; skillType: SkillType; yearsOfExperience: number } | null;
  status: SkillStatus | null;
  /** False while a round is open or once the skill is verified. */
  canSubmit: boolean;
  /** Newest first; older rounds stay as history. */
  rounds: WorkerRound[];
}

export const getVerificationStatus = (signal?: AbortSignal) =>
  api.get<VerificationStatus>("/workers/me/verification", signal ? { signal } : undefined);

export const submitReferences = (references: ReferenceInput[]) =>
  api.post<VerificationStatus>("/workers/me/references", { references });

// ── Admin / verifier ──

export interface AdminReference {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  result: ReferenceResult;
  recordedById: string | null;
  recordedAt: string | null;
}

export interface AdminRound {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  createdAt: string;
  closedAt: string | null;
  worker: { id: string; name: string; region: string; city: string };
  skill: { id: string; name: string; yearsOfExperience: number; status: SkillStatus };
  references: AdminReference[];
}

export interface FlaggedSkill {
  id: string;
  worker: { id: string; name: string };
  skill: string;
  yearsOfExperience: number;
  status: SkillStatus;
}

export const ROUNDS_PAGE_SIZE = 20;

/** One page of rounds, oldest waiting first. The API returns a plain array. */
export const listRounds = (status: RoundStatus, offset: number, signal?: AbortSignal) =>
  api.get<AdminRound[]>("/admin/verifications", {
    query: { status, limit: ROUNDS_PAGE_SIZE, offset },
    ...(signal ? { signal } : {}),
  });

export const getRound = (roundId: string, signal?: AbortSignal) =>
  api.get<AdminRound>(`/admin/verifications/${roundId}`, signal ? { signal } : undefined);

/** Records what a reference said. Returns the round, whose status may have just changed. */
export const recordResult = (referenceId: string, result: Exclude<ReferenceResult, "PENDING">) =>
  api.post<AdminRound>(`/admin/references/${referenceId}/result`, { result });

export const listFlaggedSkills = (signal?: AbortSignal) =>
  api.get<FlaggedSkill[]>("/admin/flagged-skills", signal ? { signal } : undefined);

export const clearFlag = (skillId: string) => api.post<void>(`/admin/skills/${skillId}/clear-flag`);
