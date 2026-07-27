// Insights service — Seeker Premium ($5/month).
// Shows applicants their rank, skill match, recruiter views, and expected response time.
// Turns hiring black box into transparent data seekers will pay for.

import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { billingService } from "./billing.service.js";

const PREMIUM_PRICE_CENTS = 500;

export const insightsService = {
  async purchasePremium(seekerId: string) {
    const existing = await prisma.seekerPremium.findUnique({
      where: { seekerId },
    });
    if (existing?.active) {
      throw new AppError(409, "ALREADY_PREMIUM", "Already a Premium member");
    }

    const payment = await billingService.charge(
      null,
      PREMIUM_PRICE_CENTS,
      "USD",
      "Seeker Premium - Application Insights"
    );
    if (!payment.success) {
      throw new AppError(402, "PAYMENT_FAILED", "Payment declined");
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await prisma.seekerPremium.upsert({
      where: { seekerId },
      update: {
        active: true,
        expiresAt,
        stripeSessionId: payment.transactionId,
        subscribedAt: new Date(),
      },
      create: {
        seekerId,
        active: true,
        expiresAt,
        stripeSessionId: payment.transactionId,
        subscribedAt: new Date(),
      },
    });

    return {
      premium: true,
      expiresAt: expiresAt.toISOString(),
      message: "Premium activated for 30 days",
    };
  },

  async getApplicationInsights(seekerId: string, applicationId: string) {
    const premium = await prisma.seekerPremium.findUnique({
      where: { seekerId },
    });
    if (!premium?.active || (premium.expiresAt && premium.expiresAt < new Date())) {
      throw new AppError(
        403,
        "PREMIUM_REQUIRED",
        "Premium subscription required"
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: { id: true, title: true, skills: true },
        },
      },
    });
    if (!application || application.applicantId !== seekerId) {
      throw new AppError(404, "NOT_FOUND", "Application not found");
    }

    const totalApplicants = await prisma.application.count({
      where: { jobId: application.jobId },
    });

    // Rank by community score
    const allApplicants = await prisma.application.findMany({
      where: { jobId: application.jobId },
      include: {
        applicant: {
          include: { profile: { select: { communityScore: true } } },
        },
      },
      orderBy: {
        applicant: { profile: { communityScore: "desc" } },
      },
    });
    const seekerRank =
      allApplicants.findIndex((a) => a.applicantId === seekerId) + 1;

    // Skill match
    const seekerProfile = await prisma.profile.findUnique({
      where: { userId: seekerId },
      select: { skills: true },
    });
    const jobSkills = application.job.skills;
    const matchCount = seekerProfile
      ? jobSkills.filter((s) => seekerProfile.skills.includes(s)).length
      : 0;
    const matchPercentage =
      jobSkills.length > 0
        ? Math.round((matchCount / jobSkills.length) * 100)
        : 0;

    const views = await prisma.activityLog.count({
      where: { targetId: seekerId, jobId: application.jobId },
    });

    const appTimeline = await prisma.application.findMany({
      where: {
        jobId: application.jobId,
        status: { not: "PENDING" },
      },
      select: { createdAt: true, updatedAt: true },
    });
    const avgResponseDays =
      appTimeline.length > 0
        ? Math.round(
            appTimeline.reduce((sum, a) => {
              const diff = a.updatedAt.getTime() - a.createdAt.getTime();
              return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) / appTimeline.length
          )
        : null;

    return {
      totalApplicants,
      yourRank: seekerRank > 0 ? seekerRank : null,
      skillMatchPercentage: matchPercentage,
      recruiterViews: views,
      averageResponseDays: avgResponseDays,
    };
  },

  async logProfileView(recruiterId: string, targetId: string, jobId?: string) {
    await prisma.activityLog.create({
      data: { viewerId: recruiterId, targetId, jobId: jobId ?? null },
    });
  },
};
