import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addOtherSkill, addPortfolioPhoto, getMyProfile, listSkillTypes, removeOtherSkill, removePortfolioPhoto,
  setMainSkill, setProfilePhoto, updateMyProfile, type WorkerProfile, type WorkerUpdate,
} from "../api/worker";
import { updateSessionUser, readSession } from "../auth/session";

export const workerKeys = {
  me: ["worker", "me"] as const,
  skillTypes: ["skill-types"] as const,
};

export const useMyProfile = () =>
  useQuery({ queryKey: workerKeys.me, queryFn: ({ signal }) => getMyProfile(signal) });

/** The skill dropdown. It almost never changes, so it is fetched once per visit. */
export const useSkillTypes = () =>
  useQuery({ queryKey: workerKeys.skillTypes, queryFn: ({ signal }) => listSkillTypes(signal), staleTime: 60 * 60_000 });

// Every profile-changing endpoint answers with the whole updated profile, so we drop it straight
// into the cache instead of refetching (saves a round trip on slow connections).
function useProfileMutation<V>(mutationFn: (v: V) => Promise<WorkerProfile>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (profile) => qc.setQueryData(workerKeys.me, profile) });
}

export const useUpdateProfile = () => useProfileMutation((patch: WorkerUpdate) => updateMyProfile(patch));

export const useSetMainSkill = () =>
  useProfileMutation(({ skillTypeId, years }: { skillTypeId: string; years: number }) => setMainSkill(skillTypeId, years));

export const useAddOtherSkill = () =>
  useProfileMutation(({ skillTypeId, years }: { skillTypeId: string; years: number }) => addOtherSkill(skillTypeId, years));

export const useRemoveOtherSkill = () => useProfileMutation((skillId: string) => removeOtherSkill(skillId));
export const useSetProfilePhoto = () => useProfileMutation((file: Blob) => setProfilePhoto(file));
export const useAddPortfolioPhoto = () => useProfileMutation((file: Blob) => addPortfolioPhoto(file));
export const useRemovePortfolioPhoto = () => useProfileMutation((photoId: string) => removePortfolioPhoto(photoId));

/** Keep the name shown in the signed-in session in step with a saved profile. */
export function syncSessionName(name: string) {
  const s = readSession();
  if (s && s.user.name !== name) updateSessionUser({ ...s.user, name });
}
