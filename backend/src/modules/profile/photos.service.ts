import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { compressImage } from '../../shared/image';
import { getStorage } from '../../shared/storage';
import { getWorkerProfile } from './worker.service';
import { MAX_PORTFOLIO_PHOTOS } from './visibility';

export async function setProfilePhoto(userId: string, file: Buffer) {
  const url = await getStorage().save(await compressImage(file, 512), 'profile', 'webp');
  const old = await prisma.worker.findUniqueOrThrow({ where: { userId }, select: { photoUrl: true } });
  await prisma.worker.update({ where: { userId }, data: { photoUrl: url } });
  if (old.photoUrl) await getStorage().remove(old.photoUrl);
  return getWorkerProfile(userId);
}

export async function addPortfolioPhoto(userId: string, file: Buffer) {
  const count = await prisma.portfolioPhoto.count({ where: { workerId: userId } });
  if (count >= MAX_PORTFOLIO_PHOTOS) throw new AppError(409, 'PORTFOLIO_FULL');

  const url = await getStorage().save(await compressImage(file), 'portfolio', 'webp');
  try {
    await prisma.$transaction(async (tx) => {
      // Lock the worker row so two concurrent uploads can't both slip past the 12-photo cap.
      await tx.$queryRaw`SELECT "userId" FROM "Worker" WHERE "userId" = ${userId} FOR UPDATE`;
      if ((await tx.portfolioPhoto.count({ where: { workerId: userId } })) >= MAX_PORTFOLIO_PHOTOS) {
        throw new AppError(409, 'PORTFOLIO_FULL');
      }
      await tx.portfolioPhoto.create({ data: { workerId: userId, url } });
    });
  } catch (e) {
    await getStorage().remove(url);
    throw e;
  }
  return getWorkerProfile(userId);
}

export async function removePortfolioPhoto(userId: string, photoId: string) {
  const photo = await prisma.portfolioPhoto.findFirst({ where: { id: photoId, workerId: userId } });
  if (!photo) throw new AppError(404, 'PHOTO_NOT_FOUND');
  await prisma.portfolioPhoto.delete({ where: { id: photoId } });
  await getStorage().remove(photo.url);
  return getWorkerProfile(userId);
}
