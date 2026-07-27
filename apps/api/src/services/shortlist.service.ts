import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { subscriptionService } from "./subscription.service.js";

export const shortlistService = {
  async toggleShortlist(recruiterId: string, candidateId: string, jobId?: string) {
    // Check plan limit for FREE tier
    const plan = await subscriptionService.getOrCreatePlan(recruiterId);
    if (plan.tier === "FREE") {
      const count = await prisma.candidateShortlist.count({ where: { recruiterId } });
      if (count >= 10) {
        throw new AppError(403, "PLAN_LIMIT_REACHED", "Free tier: max 10 shortlisted candidates. Upgrade to Pro for unlimited.");
      }
    }

    const existing = await prisma.candidateShortlist.findUnique({
      where: { recruiterId_candidateId: { recruiterId, candidateId } },
    });

    if (existing) {
      await prisma.candidateShortlist.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await prisma.candidateShortlist.create({
      data: { recruiterId, candidateId, jobId: jobId ?? null },
    });
    return { saved: true };
  },

  async getShortlisted(recruiterId: string, jobId?: string, page = 1, limit = 20) {
    const where: any = { recruiterId };
    if (jobId) where.jobId = jobId;

    const [items, total] = await Promise.all([
      prisma.candidateShortlist.findMany({
        where,
        include: {
          candidate: {
            include: { profile: { select: { headline: true, skills: true, communityScore: true } } },
          },
          job: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.candidateShortlist.count({ where }),
    ]);

    const formatted = items.map((item) => ({
      id: item.id,
      candidateId: item.candidateId,
      jobId: item.jobId,
      jobTitle: item.job?.title ?? null,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      candidate: {
        id: item.candidate.id,
        name: item.candidate.name,
        avatar: item.candidate.avatar,
        headline: item.candidate.profile?.headline ?? null,
        skills: item.candidate.profile?.skills ?? [],
        communityScore: item.candidate.profile?.communityScore ?? 0,
      },
    }));

    return { items: formatted, total, page, limit };
  },

  async updateNote(recruiterId: string, candidateId: string, note: string) {
    const plan = await subscriptionService.getOrCreatePlan(recruiterId);
    if (plan.tier !== "PRO") {
      throw new AppError(403, "PLAN_LIMIT_REACHED", "Notes are a Pro feature. Upgrade to add notes.");
    }

    const entry = await prisma.candidateShortlist.findUnique({
      where: { recruiterId_candidateId: { recruiterId, candidateId } },
    });
    if (!entry) throw new AppError(404, "NOT_FOUND", "Candidate not shortlisted");

    await prisma.candidateShortlist.update({
      where: { id: entry.id },
      data: { note },
    });
    return { note };
  },

  async getNote(recruiterId: string, candidateId: string) {
    const entry = await prisma.candidateShortlist.findUnique({
      where: { recruiterId_candidateId: { recruiterId, candidateId } },
      select: { note: true },
    });
    return { note: entry?.note ?? null };
  },

  async exportShortlistCsv(recruiterId: string, jobId?: string) {
    const plan = await subscriptionService.getOrCreatePlan(recruiterId);
    if (plan.tier !== "PRO") {
      throw new AppError(403, "PLAN_LIMIT_REACHED", "CSV export is a Pro feature. Upgrade to export.");
    }

    const { items } = await shortlistService.getShortlisted(recruiterId, jobId, 1, 10000);
    const rows = items.map((item) => ({
      "Candidate Name": item.candidate.name,
      Headline: item.candidate.headline ?? "",
      Skills: item.candidate.skills.join("; "),
      "Community Score": item.candidate.communityScore,
      "Job Title": item.jobTitle ?? "",
      "Saved Date": item.createdAt,
      Note: item.note ?? "",
    }));

    // Manual CSV — no json2csv dependency (ponytail: install json2csv if perf matters for large datasets)
    const headers = Object.keys(rows[0] ?? {});
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");
    return csv;
  },
};
