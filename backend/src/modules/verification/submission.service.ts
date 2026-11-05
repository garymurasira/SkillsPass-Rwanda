import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { encrypt, hashPhone } from '../../shared/crypto';

type ReferenceInput = { name: string; phone: string; relationship: string };

// FR 3.1 / FR 3.5: a worker submits 3 references for their main skill. After a failed round
// they may submit a fresh set, which starts a new round and keeps the old one as history.
export async function submitReferences(userId: string, refs: ReferenceInput[]) {
  const main = await prisma.skill.findFirst({
    where: { workerId: userId, isMain: true },
    include: { rounds: { orderBy: { roundNumber: 'desc' }, take: 1 } },
  });
  if (!main) throw new AppError(409, 'NO_MAIN_SKILL');
  if (main.status === 'VERIFIED') throw new AppError(409, 'ALREADY_VERIFIED');

  const last = main.rounds[0];
  if (last?.status === 'OPEN') throw new AppError(409, 'ROUND_OPEN');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (refs.some((r) => hashPhone(r.phone) === user.phoneHash)) throw new AppError(400, 'REFERENCE_IS_SELF');

  try {
    // The unique (skillId, roundNumber) index makes a double-submit fail instead of opening two rounds.
    await prisma.$transaction([
      prisma.verificationRound.create({
        data: {
          skillId: main.id,
          roundNumber: (last?.roundNumber ?? 0) + 1,
          references: {
            create: refs.map((r) => ({ name: r.name, phoneEncrypted: encrypt(r.phone), relationship: r.relationship })),
          },
        },
      }),
      prisma.skill.update({ where: { id: main.id }, data: { status: 'PENDING' } }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'ROUND_OPEN');
    }
    throw e;
  }
  return getVerificationStatus(userId);
}

// FR 2.4 / FR 3: what the worker sees. Reference phone numbers are not echoed back.
export async function getVerificationStatus(userId: string) {
  const main = await prisma.skill.findFirst({
    where: { workerId: userId, isMain: true },
    include: {
      skillType: true,
      rounds: { orderBy: { roundNumber: 'desc' }, include: { references: { orderBy: { name: 'asc' } } } },
    },
  });
  if (!main) return { mainSkill: null, status: null, canSubmit: false, rounds: [] };

  const canSubmit = main.status !== 'VERIFIED' && main.rounds[0]?.status !== 'OPEN';
  return {
    mainSkill: { id: main.id, skillType: main.skillType, yearsOfExperience: main.yearsOfExperience },
    status: main.status,
    flaggedForReview: main.flaggedForReview,
    canSubmit,
    rounds: main.rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      status: r.status,
      createdAt: r.createdAt,
      closedAt: r.closedAt,
      references: r.references.map((ref) => ({
        id: ref.id,
        name: ref.name,
        relationship: ref.relationship,
        result: ref.result,
        recordedAt: ref.recordedAt,
      })),
    })),
  };
}
