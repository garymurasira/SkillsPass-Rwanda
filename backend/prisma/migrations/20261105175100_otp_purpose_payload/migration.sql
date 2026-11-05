/*
  Warnings:

  - Added the required column `purpose` to the `OtpCode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN');

-- AlterTable
ALTER TABLE "OtpCode" ADD COLUMN     "payload" JSONB,
ADD COLUMN     "purpose" "OtpPurpose" NOT NULL;
