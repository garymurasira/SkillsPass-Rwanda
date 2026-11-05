-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "ratingAverage" DOUBLE PRECISION,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Worker_ratingAverage_idx" ON "Worker"("ratingAverage");

-- Search hot path: verified main skills by skill type (BR 1). Partial index keeps it small.
CREATE INDEX "Skill_verified_main_by_type" ON "Skill"("skillTypeId", "workerId") WHERE "isMain" = true AND "status" = 'VERIFIED';
-- Rating summary must stay consistent
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_rating_range" CHECK ("ratingAverage" IS NULL OR ("ratingAverage" >= 1 AND "ratingAverage" <= 5));
