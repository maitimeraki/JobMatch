// Payout service — referral bonus processing.
// Platform takes 10% fee. Referrer gets the rest. Recruiters get quality hires.

import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { billingService } from "./billing.service.js";
import { notificationService } from "./notification.service.js";

const PLATFORM_FEE_PERCENT = 10;

export const payoutService = {
  async setReferralBonus(recruiterId: string, jobId: string, bonusCents: number) {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { recruiterId: true },
    });
    if (!job) throw new AppError(404, "NOT_FOUND", "Job not found");
    if (job.recruiterId !== recruiterId) {
      throw new AppError(403, "FORBIDDEN", "Not your job listing");
    }

    await prisma.jobListing.update({
      where: { id: jobId },
      data: { referralBonus: bonusCents },
    });

    return {
      bonusCents,
      message: `Referral bonus set to $${(bonusCents / 100).toFixed(0)}`,
    };
  },

  async processReferralPayout(referralId: string) {
    const referral = await prisma.referralRequest.findUnique({
      where: { id: referralId },
      include: {
        job: { select: { referralBonus: true, title: true } },
      },
    });
    if (!referral) throw new AppError(404, "NOT_FOUND", "Referral not found");
    if (referral.status !== "COMPLETED") {
      throw new AppError(400, "NOT_COMPLETED", "Referral is not yet completed");
    }

    const existingPayout = await prisma.referralPayout.findUnique({
      where: { referralId },
    });
    if (existingPayout) {
      throw new AppError(409, "ALREADY_PAID", "Payout already processed");
    }

    const totalAmount = referral.job.referralBonus || 0;
    const platformFee = Math.round((totalAmount * PLATFORM_FEE_PERCENT) / 100);
    const netAmount = totalAmount - platformFee;

    const payment = await billingService.charge(
      null,
      totalAmount,
      "USD",
      `Referral payout: ${referral.job.title}`
    );
    if (!payment.success) {
      throw new AppError(402, "PAYMENT_FAILED", "Payment declined");
    }

    await prisma.referralPayout.create({
      data: { referralId, amount: totalAmount, platformFee, netAmount, status: "PAID", paidAt: new Date() },
    });

    await notificationService.createNotification(
      referral.requesterId,
      "PAYOUT_RECEIVED",
      "Referral Bonus Paid!",
      `You received $${(netAmount / 100).toFixed(0)} for "${referral.job.title}"`,
      "/referrals"
    );

    return { totalAmount, platformFee, netAmount, message: `You earned $${(netAmount / 100).toFixed(0)}` };
  },

  async getPayoutHistory(userId: string) {
    const payouts = await prisma.referralPayout.findMany({
      where: {
        referral: { OR: [{ requesterId: userId }, { connectorId: userId }] },
      },
      include: {
        referral: { select: { job: { select: { title: true } }, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { payouts };
  },
};
