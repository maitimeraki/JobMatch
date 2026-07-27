// Subscription service — manages recruiter plans and feature gating.
// Every recruiter gets a FREE plan on signup. Upgrade to PRO unlocks everything.

import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { billingService } from "./billing.service.js";

const PRO_PRICE_CENTS = 2900;

export interface PlanLimits {
  maxActiveJobs: number;
  maxApplicantsPerJob: number;
  maxCandidateViews: number;
  canViewFullProfiles: boolean;
  canFeatureJob: boolean;
  canUrgentBoost: boolean;
  canAccessAnalytics: boolean;
  canExportCsv: boolean;
  prioritySearch: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    maxActiveJobs: 1,
    maxApplicantsPerJob: 10,
    maxCandidateViews: 10,
    canViewFullProfiles: false,
    canFeatureJob: false,
    canUrgentBoost: false,
    canAccessAnalytics: true,
    canExportCsv: false,
    prioritySearch: false,
  },
  PRO: {
    maxActiveJobs: 999,
    maxApplicantsPerJob: 99999,
    maxCandidateViews: 99999,
    canViewFullProfiles: true,
    canFeatureJob: true,
    canUrgentBoost: true,
    canAccessAnalytics: true,
    canExportCsv: true,
    prioritySearch: true,
  },
};

export const subscriptionService = {
  async getOrCreatePlan(recruiterId: string) {
    let plan = await prisma.recruiterPlan.findUnique({
      where: { recruiterId },
    });
    if (!plan) {
      plan = await prisma.recruiterPlan.create({
        data: { recruiterId },
      });
    }
    return plan;
  },

  async getLimits(recruiterId: string): Promise<PlanLimits> {
    const plan = await this.getOrCreatePlan(recruiterId);
    return PLAN_LIMITS[plan.tier] || PLAN_LIMITS.FREE;
  },

  async upgradeToPro(recruiterId: string) {
    const plan = await this.getOrCreatePlan(recruiterId);
    if (plan.tier === "PRO") {
      throw new AppError(409, "ALREADY_PRO", "Already on Pro plan");
    }

    const payment = await billingService.charge(
      plan.stripeCustomerId,
      PRO_PRICE_CENTS,
      "USD",
      "Pro Recruiter subscription"
    );

    if (!payment.success) {
      throw new AppError(402, "PAYMENT_FAILED", "Payment declined");
    }

    await prisma.recruiterPlan.update({
      where: { recruiterId },
      data: {
        tier: "PRO",
        maxActiveJobs: 999,
        maxApplicantsPerJob: 99999,
        maxCandidateViews: 99999,
        subscribedAt: new Date(),
        stripeSubscriptionId: payment.transactionId,
      },
    });

    return { plan: "PRO", message: "Upgraded to Pro" };
  },

  async downgradeToFree(recruiterId: string) {
    const plan = await this.getOrCreatePlan(recruiterId);
    if (plan.tier === "FREE") {
      throw new AppError(409, "ALREADY_FREE", "Already on Free plan");
    }

    await prisma.recruiterPlan.update({
      where: { recruiterId },
      data: {
        tier: "FREE",
        maxActiveJobs: 1,
        maxApplicantsPerJob: 10,
        maxCandidateViews: 10,
        subscribedAt: null,
        stripeSubscriptionId: null,
      },
    });

    return { plan: "FREE", message: "Downgraded to Free" };
  },

  async incrementJobsUsed(recruiterId: string) {
    await prisma.recruiterPlan.update({
      where: { recruiterId },
      data: { activeJobsUsed: { increment: 1 } },
    });
  },

  async decrementJobsUsed(recruiterId: string) {
    await prisma.recruiterPlan.update({
      where: { recruiterId },
      data: { activeJobsUsed: { decrement: 1 } },
    });
  },

  async incrementCandidateViews(recruiterId: string) {
    await prisma.recruiterPlan.update({
      where: { recruiterId },
      data: { candidateViewsUsed: { increment: 1 } },
    });
  },
};
