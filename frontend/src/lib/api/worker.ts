import { api } from "./client";
import type { AuthUser, Language } from "./auth";

// Hand-pinned shapes of the worker endpoints (the OpenAPI file marks every field optional).
// They mirror backend/src/modules/profile/worker.service.ts.

export type SkillStatus = "PENDING" | "VERIFIED" | "NOT_VERIFIED";

export interface SkillType {
  id: string;
  slug: string;
  nameEn: string;
  nameRw: string;
  nameFr: string;
}

export interface SkillView {
  id: string;
  skillType: SkillType;
  yearsOfExperience: number;
  status: SkillStatus;
  /** True when the experience changed after verification and a staff member should take a look. */
  flaggedForReview: boolean;
}

export type MissingPart = "mainSkill" | "photo" | "bio";

export interface PortfolioPhoto {
  id: string;
  /** Server-relative path; wrap with assetUrl() before using it in an <img>. */
  url: string;
  uploadedAt: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  /** A new number waiting for its SMS code (BR 4d). */
  pendingPhone: string | null;
  language: Language;
  region: string;
  city: string;
  bio: string | null;
  photoUrl: string | null;
  shareContact: boolean;
  mainSkill: SkillView | null;
  otherSkills: SkillView[];
  portfolio: PortfolioPhoto[];
  profileComplete: boolean;
  missing: MissingPart[];
  visibleToEmployers: boolean;
}

export interface WorkerUpdate {
  name?: string;
  region?: string;
  city?: string;
  /** Send an empty string to clear it. */
  bio?: string | null;
  shareContact?: boolean;
}

export const listSkillTypes = (signal?: AbortSignal) =>
  api.get<SkillType[]>("/skill-types", { auth: false, ...(signal ? { signal } : {}) });

export const getMyProfile = (signal?: AbortSignal) =>
  api.get<WorkerProfile>("/workers/me", signal ? { signal } : undefined);

export const updateMyProfile = (patch: WorkerUpdate) => api.put<WorkerProfile>("/workers/me", patch);

export const setMainSkill = (skillTypeId: string, yearsOfExperience: number) =>
  api.put<WorkerProfile>("/workers/me/main-skill", { skillTypeId, yearsOfExperience });

export const addOtherSkill = (skillTypeId: string, yearsOfExperience: number) =>
  api.post<WorkerProfile>("/workers/me/other-skills", { skillTypeId, yearsOfExperience });

export const removeOtherSkill = (skillId: string) => api.delete<WorkerProfile>(`/workers/me/other-skills/${skillId}`);

const photoForm = (file: Blob) => {
  const form = new FormData();
  form.append("photo", file, file instanceof File ? file.name : "photo.jpg");
  return form;
};

export const setProfilePhoto = (file: Blob) => api.upload<WorkerProfile>("PUT", "/workers/me/photo", photoForm(file));

export const addPortfolioPhoto = (file: Blob) =>
  api.upload<WorkerProfile>("POST", "/workers/me/portfolio", photoForm(file));

export const removePortfolioPhoto = (photoId: string) =>
  api.delete<WorkerProfile>(`/workers/me/portfolio/${photoId}`);

// ── Shared by every signed-in user ──

export const requestPhoneChange = (phone: string) => api.post<{ message: string }>("/me/phone/change", { phone });

export const confirmPhoneChange = (code: string) => api.post<{ phone: string }>("/me/phone/confirm", { code });

export const setLanguage = (language: Language) => api.patch<AuthUser>("/auth/me/language", { language });
