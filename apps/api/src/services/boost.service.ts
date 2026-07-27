// Boost service — featured listings ($9) and urgent boosts ($19).
// Fastest revenue path. Low price, high intent, immediate value.

import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { billingService } from "./billing.service.js";
import { notificationService } from "./notification.service.js";

const PRICES: Record<string, { cents: number; label: string; days: number }> = {
  FEATURED: { cents: 900, label: "Featured Job", days: 7 },
  URGENT: { cents: 1900, label: "Urgent Hire Boost", days: 3 },
};

export const boostService = {
  async purchaseBoost(
    recruiterId: string,
    jobId: string,
    type: "FEATURED" | "URGENT"
  ) {
    const price = PRICES[type];
    if (!price) {
      throw new AppError(400, "INVALID_BOOST_TYPE", "Invalid boost type");
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { recruiterId: true, title: true, skills: true },
    });
    if (!job) throw new AppError(404, "NOT_FOUND", "Job not found");
    if (job.recruiterId !== recruiterId) {
      throw new AppError(403, "FORBIDDEN", "Not your job listing");
    }

    const payment = await billingService.charge(
      null,
      price.cents,
      "USD",
      `${price.label}: ${job.title}`
    );
    if (!payment.success) {
      throw new AppError(402, "PAYMENT_FAILED", "Payment declined");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + price.days);

    await prisma.$transaction(async (tx) => {
      await tx.boostPurchase.create({
        data: {
          jobId,
          recruiterId,
          type,
          amount: price.cents,
          currency: "USD",
          stripePaymentIntentId: payment.transactionId,
          expiresAt,
        },
      });

      const updateData: Record<string, unknown> = {
        [type === "FEATURED" ? "isFeatured" : "isUrgent"]: true,
        [type === "FEATURED" ? "featuredExpiresAt" : "urgentExpiresAt"]: expiresAt,
      };
      await tx.jobListing.update({
        where: { id: jobId },
        data: updateData as any,
      });
    });

    // Notify matching candidates for urgent hires
    if (type === "URGENT" && job.skills.length > 0) {
      const matchingCandidates = await prisma.user.findMany({
        where: {
          role: "SEEKER",
          profile: { skills: { hasSome: job.skills } },
        },
        select: { id: true },
      });

      for (const candidate of matchingCandidates) {
        await notificationService.createNotification(
          candidate.id,
          "JOB_BOOSTED",
          "Urgent Hire!",
          `"${job.title}" urgently needs your skills!`,
          `/jobs/${jobId}`
        );
      }
    }

    return {
      type,
      amount: price.cents,
      expiresAt: expiresAt.toISOString(),
      message: `${price.label} active for ${price.days} days`,
    };
  },

  async getActiveBoosts(jobId: string) {
    const boosts = await prisma.boostPurchase.findMany({
      where: { jobId, active: true, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return { boosts };
  },

  async expireStaleBoosts() {
    const now = new Date();
    await prisma.$transaction([
      prisma.jobListing.updateMany({
        where: { isFeatured: true, featuredExpiresAt: { lt: now } },
        data: { isFeatured: false, featuredExpiresAt: null },
      }),
      prisma.jobListing.updateMany({
        where: { isUrgent: true, urgentExpiresAt: { lt: now } },
        data: { isUrgent: false, urgentExpiresAt: null },
      }),
      prisma.boostPurchase.updateMany({
        where: { active: true, expiresAt: { lt: now } },
        data: { active: false },
      }),
    ]);
  },
};
