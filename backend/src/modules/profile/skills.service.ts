import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { getWorkerProfile } from './worker.service';

export async function listSkillTypes() {
  return prisma.skillType.findMany({ orderBy: { nameEn: 'asc' } });
}

// FR 2.1 + BR 4: set or change the single main skill.
export async function setMainSkill(userId: string, skillTypeId: string, yearsOfExperience: number) {
  await prisma.$transaction(async (tx) => {
    if (!(await tx.skillType.findUnique({ where: { id: skillTypeId } }))) {
      throw new AppError(404, 'SKILL_TYPE_NOT_FOUND');
    }
    const main = await tx.skill.findFirst({ where: { workerId: userId, isMain: true } });

    if (main && main.skillTypeId === skillTypeId) {
      // BR 4(b): a verified skill stays verified but is flagged for admin review.
      if (main.yearsOfExperience !== yearsOfExperience) {
        await tx.skill.update({
          where: { id: main.id },
          data: { yearsOfExperience, flaggedForReview: main.status === 'VERIFIED' ? true : main.flaggedForReview },
        });
      }
      return;
    }

    // BR 4(c): a different main skill starts over and needs 3 new references.
    if (main) {
      await tx.skill.update({
        where: { id: main.id },
        data: { isMain: false, status: 'PENDING', flaggedForReview: false },
      });
      await tx.verificationRound.updateMany({
        where: { skillId: main.id, status: 'OPEN' },
        data: { status: 'NOT_VERIFIED', closedAt: new Date() },
      });
    }

    const existing = await tx.skill.findUnique({
      where: { workerId_skillTypeId: { workerId: userId, skillTypeId } },
    });
    const data = { isMain: true, yearsOfExperience, status: 'PENDING' as const, flaggedForReview: false };
    if (existing) await tx.skill.update({ where: { id: existing.id }, data });
    else await tx.skill.create({ data: { ...data, workerId: userId, skillTypeId } });
  });
  return getWorkerProfile(userId);
}

export async function addOtherSkill(userId: string, skillTypeId: string, yearsOfExperience: number) {
  if (!(await prisma.skillType.findUnique({ where: { id: skillTypeId } }))) {
    throw new AppError(404, 'SKILL_TYPE_NOT_FOUND');
  }
  try {
    await prisma.skill.create({ data: { workerId: userId, skillTypeId, yearsOfExperience, isMain: false } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'SKILL_EXISTS');
    }
    throw e;
  }
  return getWorkerProfile(userId);
}

export async function removeOtherSkill(userId: string, skillId: string) {
  const skill = await prisma.skill.findFirst({ where: { id: skillId, workerId: userId } });
  if (!skill) throw new AppError(404, 'SKILL_NOT_FOUND');
  if (skill.isMain) throw new AppError(409, 'CANNOT_DELETE_MAIN_SKILL');
  await prisma.skill.delete({ where: { id: skillId } });
  return getWorkerProfile(userId);
}
