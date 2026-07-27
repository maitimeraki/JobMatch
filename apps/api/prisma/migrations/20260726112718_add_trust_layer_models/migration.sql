-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('PROJECT_SHOWCASE', 'LEARNING', 'QUESTION', 'ACHIEVEMENT', 'DISCUSSION');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('DIRECT', 'REFERRAL');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'POST_ENDORSED';
ALTER TYPE "NotificationType" ADD VALUE 'REFERRAL_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'REFERRAL_ACCEPTED';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "source" "ApplicationSource" NOT NULL DEFAULT 'DIRECT';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "category" "PostCategory" NOT NULL DEFAULT 'DISCUSSION';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "communityScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,
    "endorsedId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "post_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "endorsements_endorsedId_idx" ON "endorsements"("endorsedId");

-- CreateIndex
CREATE INDEX "endorsements_skillId_idx" ON "endorsements"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_endorserId_endorsedId_skillId_key" ON "endorsements"("endorserId", "endorsedId", "skillId");

-- CreateIndex
CREATE INDEX "referral_requests_status_idx" ON "referral_requests"("status");

-- CreateIndex
CREATE INDEX "referral_requests_connectorId_idx" ON "referral_requests"("connectorId");

-- CreateIndex
CREATE INDEX "Post_category_idx" ON "Post"("category");

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorsedId_fkey" FOREIGN KEY ("endorsedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_requests" ADD CONSTRAINT "referral_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_requests" ADD CONSTRAINT "referral_requests_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
