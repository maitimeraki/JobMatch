-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PROFILE_VIEWED';
ALTER TYPE "NotificationType" ADD VALUE 'JOB_BOOSTED';
ALTER TYPE "NotificationType" ADD VALUE 'PREMIUM_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_RECEIVED';

-- AlterTable
ALTER TABLE "JobListing" ADD COLUMN     "featuredExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralBonus" INTEGER,
ADD COLUMN     "referralCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "urgentExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "recruiter_plans" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "activeJobsUsed" INTEGER NOT NULL DEFAULT 0,
    "maxActiveJobs" INTEGER NOT NULL DEFAULT 1,
    "maxApplicantsPerJob" INTEGER NOT NULL DEFAULT 10,
    "maxCandidateViews" INTEGER NOT NULL DEFAULT 10,
    "candidateViewsUsed" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscribedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seeker_premiums" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "stripeSessionId" TEXT,
    "subscribedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seeker_premiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_purchases" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripePaymentIntentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_payouts" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_plans_recruiterId_key" ON "recruiter_plans"("recruiterId");

-- CreateIndex
CREATE UNIQUE INDEX "seeker_premiums_seekerId_key" ON "seeker_premiums"("seekerId");

-- CreateIndex
CREATE INDEX "boost_purchases_jobId_idx" ON "boost_purchases"("jobId");

-- CreateIndex
CREATE INDEX "boost_purchases_recruiterId_idx" ON "boost_purchases"("recruiterId");

-- CreateIndex
CREATE INDEX "boost_purchases_expiresAt_idx" ON "boost_purchases"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "referral_payouts_referralId_key" ON "referral_payouts"("referralId");

-- CreateIndex
CREATE INDEX "activity_logs_targetId_createdAt_idx" ON "activity_logs"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_viewerId_idx" ON "activity_logs"("viewerId");

-- CreateIndex
CREATE INDEX "JobListing_isFeatured_featuredExpiresAt_idx" ON "JobListing"("isFeatured", "featuredExpiresAt");

-- CreateIndex
CREATE INDEX "JobListing_isUrgent_urgentExpiresAt_idx" ON "JobListing"("isUrgent", "urgentExpiresAt");

-- AddForeignKey
ALTER TABLE "recruiter_plans" ADD CONSTRAINT "recruiter_plans_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_premiums" ADD CONSTRAINT "seeker_premiums_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_purchases" ADD CONSTRAINT "boost_purchases_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_purchases" ADD CONSTRAINT "boost_purchases_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_payouts" ADD CONSTRAINT "referral_payouts_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referral_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
