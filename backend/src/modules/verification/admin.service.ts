import type { Prisma, ReferenceResult, RoundStatus } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { decrypt } from '../../shared/crypto';

const REQUIRED_CONFIRMATIONS = 2; // FR 3.4: verified when at least 2 of 3 are confirmed

const roundInclude = {
  references: { orderBy: { name: 'asc' } },
  skill: { include: { skillType: true, worker: { include: { user: true } } } },
} satisfies Prisma.VerificationRoundInclude;

type RoundWithRefs = Prisma.VerificationRoundGetPayload<{ include: typeof roundInclude }>;

// Admins phone the references, so they (and only they) get the decrypted numbers.
function roundView(r: RoundWithRefs) {
  return {
    id: r.id,
    roundNumber: r.roundNumber,
    status: r.status,
    createdAt: r.createdAt,
    closedAt: r.closedAt,
    worker: { id: r.skill.workerId, name: r.skill.worker.user.name, region: r.skill.worker.region, city: r.skill.worker.city },
    skill: {
      id: r.skillId,
      name: r.skill.skillType.nameEn,
      yearsOfExperience: r.skill.yearsOfExperience,
      status: r.skill.status,
    },
    references: r.references.map((ref) => ({
      id: ref.id,
      name: ref.name,
      phone: decrypt(ref.phoneEncrypted),
      relationship: ref.relationship,
      result: ref.result,
      recordedById: ref.recordedById,
      recordedAt: ref.recordedAt,
    })),
  };
}

export async function listRounds(status: RoundStatus, limit: number, offset: number) {
  const rounds = await prisma.verificationRound.findMany({
    where: { status },
    include: roundInclude,
    orderBy: { createdAt: 'asc' }, // oldest waiting first
    take: limit,
    skip: offset,
  });
  return rounds.map(roundView);
}

export async function getRound(roundId: string) {
  const round = await prisma.verificationRound.findUnique({ where: { id: roundId }, include: roundInclude });
  if (!round) throw new AppError(404, 'ROUND_NOT_FOUND');
  return roundView(round);
}

// FR 3.2 – 3.4: record what a reference said, then recompute the round and the skill status.
export async function recordResult(adminId: string, referenceId: string, result: ReferenceResult) {
  const roundId = await prisma.$transaction(async (tx) => {
    const ref = await tx.reference.findUnique({ where: { id: referenceId } });
    if (!ref) throw new AppError(404, 'REFERENCE_NOT_FOUND');

    // Serialise admins working on the same round so the tally below can't race.
    await tx.$queryRaw`SELECT "id" FROM "VerificationRound" WHERE "id" = ${ref.roundId} FOR UPDATE`;
    const round = await tx.verificationRound.findUniqueOrThrow({
      where: { id: ref.roundId },
      include: { references: true },
    });
    if (round.status !== 'OPEN') throw new AppError(409, 'ROUND_CLOSED');

    await tx.reference.update({
      where: { id: referenceId },
      data: { result, recordedById: adminId, recordedAt: new Date() },
    });

    const results = round.references.map((r) => (r.id === referenceId ? result : r.result));
    const confirmed = results.filter((r) => r === 'CONFIRMED').length;
    const pending = results.filter((r) => r === 'PENDING').length;

    let outcome: 'VERIFIED' | 'NOT_VERIFIED' | null = null;
    if (confirmed >= REQUIRED_CONFIRMATIONS) outcome = 'VERIFIED';
    else if (confirmed + pending < REQUIRED_CONFIRMATIONS) outcome = 'NOT_VERIFIED'; // can no longer reach 2

    if (outcome) {
      await tx.verificationRound.update({ where: { id: round.id }, data: { status: outcome, closedAt: new Date() } });
      await tx.skill.update({
        where: { id: round.skillId },
        data: { status: outcome, ...(outcome === 'VERIFIED' ? { flaggedForReview: false } : {}) },
      });
    }
    return round.id;
  });
  return getRound(roundId);
}

// BR 4(b): skills whose experience changed after verification wait here for an admin to look.
export async function listFlaggedSkills() {
  const skills = await prisma.skill.findMany({
    where: { flaggedForReview: true },
    include: { skillType: true, worker: { include: { user: true } } },
    orderBy: { updatedAt: 'asc' },
  });
  return skills.map((s) => ({
    id: s.id,
    worker: { id: s.workerId, name: s.worker.user.name },
    skill: s.skillType.nameEn,
    yearsOfExperience: s.yearsOfExperience,
    status: s.status,
  }));
}

export async function clearFlag(skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new AppError(404, 'SKILL_NOT_FOUND');
  await prisma.skill.update({ where: { id: skillId }, data: { flaggedForReview: false } });
}
