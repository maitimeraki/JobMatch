import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { notificationService } from "./notification.service.js";
import type { ReferralRequestResponse } from "@jobmatch/shared";

function formatReferralRequest(
  request: Record<string, unknown>
): ReferralRequestResponse {
  const requester = request.requester as {
    id: string;
    name: string;
    avatar: string | null;
  };
  const connector = request.connector as {
    id: string;
    name: string;
    avatar: string | null;
  };
  const job = request.job as { id: string; title: string } | null;

  const createdAt =
    request.createdAt instanceof Date
      ? request.createdAt.toISOString()
      : String(request.createdAt);

  return {
    id: request.id as string,
    requester,
    connector,
    job: job ?? null,
    message: (request.message as string) ?? null,
    status: request.status as ReferralRequestResponse["status"],
    createdAt,
  };
}

export const referralService = {
  async createReferral(
    requesterId: string,
    connectorId: string,
    jobId: string | null,
    message?: string | null
  ) {
    if (requesterId === connectorId) {
      throw new AppError(
        400,
        "SELF_REFERRAL",
        "Cannot send a referral request to yourself"
      );
    }

    const connector = await prisma.user.findUnique({
      where: { id: connectorId },
      select: { id: true },
    });
    if (!connector) {
      throw new AppError(404, "NOT_FOUND", "Connector not found");
    }

    let jobTitle = "a position";
    if (jobId) {
      const job = await prisma.jobListing.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, status: true },
      });
      if (!job) {
        throw new AppError(404, "NOT_FOUND", "Job not found");
      }
      if (job.status !== "ACTIVE") {
        throw new AppError(
          400,
          "JOB_NOT_ACTIVE",
          "Job is not accepting referrals"
        );
      }
      jobTitle = job.title;
    }

    const existing = await prisma.referralRequest.findFirst({
      where: {
        requesterId,
        connectorId,
        ...(jobId ? { jobId } : { jobId: null }),
        status: "PENDING",
      },
    });
    if (existing) {
      throw new AppError(
        409,
        "DUPLICATE_REQUEST",
        "A pending referral request already exists for this connector"
      );
    }

    const referral = await prisma.referralRequest.create({
      data: {
        requesterId,
        connectorId,
        jobId: jobId ?? null,
        message: message ?? null,
        status: "PENDING",
      },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        connector: { select: { id: true, name: true, avatar: true } },
      },
    });

    await notificationService.createNotification(
      connectorId,
      "REFERRAL_REQUEST",
      "Referral Request",
      `${referral.requester.name} has requested a referral for ${jobTitle}`,
      `/referrals/${referral.id}`
    );

    return {
      referral: formatReferralRequest({
        ...referral,
        job: jobId ? { id: jobId, title: jobTitle } : null,
      } as unknown as Record<string, unknown>),
    };
  },

  async getSentRequests(userId: string) {
    const requests = await prisma.referralRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        connector: { select: { id: true, name: true, avatar: true } },
      },
    });

    const jobIds = [...new Set(requests.map((r) => r.jobId).filter(Boolean))] as string[];
    const jobs = await prisma.jobListing.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    return {
      requests: requests.map((r) =>
        formatReferralRequest({
          ...r,
          job: r.jobId ? (jobMap.get(r.jobId) ?? { id: r.jobId, title: "Unknown Job" }) : null,
        } as unknown as Record<string, unknown>)
      ),
    };
  },

  async getReceivedRequests(userId: string) {
    const requests = await prisma.referralRequest.findMany({
      where: { connectorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        connector: { select: { id: true, name: true, avatar: true } },
      },
    });

    const jobIds = [...new Set(requests.map((r) => r.jobId).filter(Boolean))] as string[];
    const jobs = await prisma.jobListing.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true },
    });
    const jobMap = new Map(jobs.map((j) => [j.id, j]));

    return {
      requests: requests.map((r) =>
        formatReferralRequest({
          ...r,
          job: r.jobId ? (jobMap.get(r.jobId) ?? { id: r.jobId, title: "Unknown Job" }) : null,
        } as unknown as Record<string, unknown>)
      ),
    };
  },

  async acceptRequest(requestId: string, connectorId: string) {
    const request = await prisma.referralRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { id: true, name: true } },
        connector: { select: { id: true, name: true } },
      },
    });
    if (!request) {
      throw new AppError(404, "NOT_FOUND", "Referral request not found");
    }
    if (request.connectorId !== connectorId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Not your referral request to accept"
      );
    }
    if (request.status !== "PENDING") {
      throw new AppError(
        400,
        "INVALID_STATUS",
        "Referral request is not pending"
      );
    }

    const job = request.jobId ? await prisma.jobListing.findUnique({
      where: { id: request.jobId },
      select: { id: true, title: true },
    }) : null;

    await prisma.referralRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    await notificationService.createNotification(
      request.requester.id,
      "REFERRAL_ACCEPTED",
      "Referral Accepted",
      `${request.connector.name} has accepted your referral request for ${job?.title ?? "the position"}`,
      `/referrals/${requestId}`
    );

    return { message: "Referral request accepted" };
  },

  async declineRequest(requestId: string, connectorId: string) {
    const request = await prisma.referralRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new AppError(404, "NOT_FOUND", "Referral request not found");
    }
    if (request.connectorId !== connectorId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Not your referral request to decline"
      );
    }
    if (request.status !== "PENDING") {
      throw new AppError(
        400,
        "INVALID_STATUS",
        "Referral request is not pending"
      );
    }

    await prisma.referralRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED" },
    });

    return { message: "Referral request declined" };
  },

  async completeRequest(requestId: string) {
    const request = await prisma.referralRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new AppError(404, "NOT_FOUND", "Referral request not found");
    }
    if (request.status !== "ACCEPTED") {
      throw new AppError(
        400,
        "INVALID_STATUS",
        "Referral request must be accepted first"
      );
    }

    await prisma.referralRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED" },
    });

    // ponytail: best-effort payout trigger — referral is already marked complete
    try {
      const { payoutService } = await import("./payout.service.js");
      await payoutService.processReferralPayout(requestId);
    } catch (_err) {
      // payout is non-blocking
    }

    return { message: "Referral request completed" };
  },
};
