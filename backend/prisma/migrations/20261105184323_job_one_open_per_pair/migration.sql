-- This is an empty migration.-- At most one unfinished job between an employer and a worker (prevents duplicate proposals).
CREATE UNIQUE INDEX "Job_one_open_per_pair" ON "Job"("employerId", "workerId") WHERE "status" <> 'COMPLETED';
