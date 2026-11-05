-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('RW', 'EN', 'FR');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('PENDING', 'VERIFIED', 'NOT_VERIFIED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('OPEN', 'VERIFIED', 'NOT_VERIFIED');

-- CreateEnum
CREATE TYPE "ReferenceResult" AS ENUM ('PENDING', 'CONFIRMED', 'NOT_CONFIRMED', 'UNREACHABLE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('IN_PROGRESS', 'EMPLOYER_MARKED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "phoneEncrypted" TEXT NOT NULL,
    "pendingPhoneHash" TEXT,
    "pendingPhoneEncrypted" TEXT,
    "name" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'RW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "userId" TEXT NOT NULL,
    "secondFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecretEncrypted" TEXT,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Employer" (
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Worker" (
    "userId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "bio" VARCHAR(300),
    "photoUrl" TEXT,
    "shareContact" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "SkillType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRw" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,

    CONSTRAINT "SkillType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "skillTypeId" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "status" "SkillStatus" NOT NULL DEFAULT 'PENDING',
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRound" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneEncrypted" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "result" "ReferenceResult" NOT NULL DEFAULT 'PENDING',
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3),

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioPhoto" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "employerId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("employerId","workerId")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "employerMarkedAt" TIMESTAMP(3),
    "workerConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneHash_key" ON "User"("phoneHash");

-- CreateIndex
CREATE INDEX "OtpCode_phoneHash_createdAt_idx" ON "OtpCode"("phoneHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Worker_region_city_idx" ON "Worker"("region", "city");

-- CreateIndex
CREATE UNIQUE INDEX "SkillType_slug_key" ON "SkillType"("slug");

-- CreateIndex
CREATE INDEX "Skill_skillTypeId_status_idx" ON "Skill"("skillTypeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_workerId_skillTypeId_key" ON "Skill"("workerId", "skillTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRound_skillId_roundNumber_key" ON "VerificationRound"("skillId", "roundNumber");

-- CreateIndex
CREATE INDEX "Reference_roundId_idx" ON "Reference"("roundId");

-- CreateIndex
CREATE INDEX "PortfolioPhoto_workerId_idx" ON "PortfolioPhoto"("workerId");

-- CreateIndex
CREATE INDEX "Job_workerId_status_idx" ON "Job"("workerId", "status");

-- CreateIndex
CREATE INDEX "Job_employerId_idx" ON "Job"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_jobId_key" ON "Rating"("jobId");

-- CreateIndex
CREATE INDEX "Rating_workerId_createdAt_idx" ON "Rating"("workerId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_sentAt_idx" ON "Message"("senderId", "receiverId", "sentAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_readAt_idx" ON "Message"("receiverId", "readAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_skillTypeId_fkey" FOREIGN KEY ("skillTypeId") REFERENCES "SkillType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRound" ADD CONSTRAINT "VerificationRound_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "VerificationRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioPhoto" ADD CONSTRAINT "PortfolioPhoto_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints Prisma cannot express in the schema
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_stars_range" CHECK ("stars" BETWEEN 1 AND 5);
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_years_nonneg" CHECK ("yearsOfExperience" >= 0);
-- A worker has at most one main skill (FR 2.1)
CREATE UNIQUE INDEX "Skill_one_main_per_worker" ON "Skill"("workerId") WHERE "isMain" = true;
