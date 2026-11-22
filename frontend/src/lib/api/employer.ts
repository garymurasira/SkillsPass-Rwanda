import { api } from "./client";
import type { Language } from "./auth";
import type { SkillType } from "./worker";

// Hand-pinned shapes (see backend/src/modules/search/*.ts and modules/profile/employer.service.ts).

export interface Rating {
  /** null when nobody has rated yet. */
  average: number | null;
  count: number;
}

/** One worker in search results or favorites. Never carries a phone number (BR 5). */
export interface WorkerCard {
  id: string;
  name: string;
  photoUrl: string | null;
  region: string;
  city: string;
  mainSkill: {
    slug: string;
    nameEn: string;
    nameRw: string;
    nameFr: string;
    yearsOfExperience: number;
    verified: boolean;
  };
  rating: Rating;
  isFavorite: boolean;
}

export interface WorkerPage {
  items: WorkerCard[];
  total: number;
  limit: number;
  offset: number;
}

export interface Review {
  stars: number;
  comment: string | null;
  createdAt: string;
  /** The company that left it. */
  employer: string;
}

/** What an employer sees on a worker's profile. */
export interface WorkerDetail {
  id: string;
  name: string;
  photoUrl: string | null;
  region: string;
  city: string;
  bio: string | null;
  mainSkill: { skillType: SkillType; yearsOfExperience: number; verified: boolean };
  otherSkills: { skillType: SkillType; yearsOfExperience: number }[];
  portfolio: { id: string; url: string }[];
  rating: Rating;
  reviews: Review[];
  /** Only present when the worker chose to share it (BR 5). */
  phone: string | null;
  isFavorite: boolean;
}

export interface SearchFilters {
  /** Skill slug, e.g. "electrician". */
  skill?: string;
  region?: string;
  city?: string;
  /** 1 to 5. */
  minRating?: number;
}

export const SEARCH_PAGE_SIZE = 20;

export const searchWorkers = (filters: SearchFilters, offset: number, signal?: AbortSignal) =>
  api.get<WorkerPage>("/workers", {
    query: { ...filters, limit: SEARCH_PAGE_SIZE, offset },
    ...(signal ? { signal } : {}),
  });

export const getWorkerDetail = (id: string, signal?: AbortSignal) =>
  api.get<WorkerDetail>(`/workers/${id}`, signal ? { signal } : undefined);

export const listFavorites = (offset: number, signal?: AbortSignal) =>
  api.get<WorkerPage>("/favorites", { query: { limit: SEARCH_PAGE_SIZE, offset }, ...(signal ? { signal } : {}) });

export const addFavorite = (workerId: string) => api.put<void>(`/favorites/${workerId}`);
export const removeFavorite = (workerId: string) => api.delete<void>(`/favorites/${workerId}`);

// ── The employer's own company profile ──

export interface EmployerProfile {
  id: string;
  name: string;
  phone: string;
  pendingPhone: string | null;
  language: Language;
  companyName: string;
  region: string;
  city: string;
  contactInfo: string;
}

export interface EmployerUpdate {
  name?: string;
  companyName?: string;
  region?: string;
  city?: string;
  contactInfo?: string;
}

export const getEmployerProfile = (signal?: AbortSignal) =>
  api.get<EmployerProfile>("/employers/me", signal ? { signal } : undefined);

export const updateEmployerProfile = (patch: EmployerUpdate) => api.put<EmployerProfile>("/employers/me", patch);

