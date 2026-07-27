import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { notificationService } from "./notification.service.js";
import type {
  CreateJobInput,
  UpdateJobInput,
  JobSearchInput,
  JobResponse,
  ApplicationResponse,
} from "@jobmatch/shared";

function formatJob(
  job: Record<string, unknown>,
  userId?: string
): JobResponse {
  const recruiter = job.recruiter as {
    id: string;
    name: string;
    avatar: string | null;
    recruiterPlan?: { verified: boolean } | null;
  };
  const isVerified = recruiter.recruiterPlan?.verified ?? false;
  const createdAt =
    job.createdAt instanceof Date
      ? job.createdAt.toISOString()
      : String(job.createdAt);

  return {
    id: job.id as string,
    recruiterId: job.recruiterId as string,
    recruiter: { id: recruiter.id, name: recruiter.name, avatar: recruiter.avatar, isVerified },
    title: job.title as string,
    description: job.description as string,
    location: job.location as string,
    type: job.type as JobResponse["type"],
    level: job.level as JobResponse["level"],
    salaryMin: (job.salaryMin as number) ?? null,
    salaryMax: (job.salaryMax as number) ?? null,
    salaryCurrency: (job.salaryCurrency as string) ?? "USD",
    skills: (job.skills as string[]) ?? [],
    status: job.status as JobResponse["status"],
    applicationsCount: job._applicationsCount as number | undefined,
    bookmarked: job._bookmarked as boolean | undefined,
    matchScore: job._matchScore as number | undefined,
    isFeatured: (job.isFeatured as boolean) ?? false,
    isUrgent: (job.isUrgent as boolean) ?? false,
    featuredExpiresAt: job.featuredExpiresAt
      ? (job.featuredExpiresAt instanceof Date ? job.featuredExpiresAt.toISOString() : String(job.featuredExpiresAt))
      : null,
    urgentExpiresAt: job.urgentExpiresAt
      ? (job.urgentExpiresAt instanceof Date ? job.urgentExpiresAt.toISOString() : String(job.urgentExpiresAt))
      : null,
    referralBonus: (job.referralBonus as number) ?? null,
    createdAt,
  };
}

function formatApplication(
  app: Record<string, unknown>
): ApplicationResponse {
  const createdAt =
    app.createdAt instanceof Date
      ? app.createdAt.toISOString()
      : String(app.createdAt);

  return {
    id: app.id as string,
    jobId: app.jobId as string,
    job: app.job as ApplicationResponse["job"],
    applicant: app.applicant as ApplicationResponse["applicant"],
    resumeUrl: app.resumeUrl as string,
    coverLetter: (app.coverLetter as string) ?? null,
    status: app.status as ApplicationResponse["status"],
    source: (app.source as ApplicationResponse["source"]) ?? "DIRECT",
    createdAt,
  };
}

export const jobService = {
  async createJob(recruiterId: string, data: CreateJobInput) {
    const job = await prisma.jobListing.create({
      data: {
        recruiterId,
        title: data.title,
        description: data.description,
        location: data.location,
        type: data.type,
        level: data.level,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        salaryCurrency: data.salaryCurrency,
        skills: data.skills,
      },
      include: {
        recruiter: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
      },
    });

    return { job: formatJob(job) };
  },

  async searchJobs(filters: JobSearchInput) {
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.level) {
      where.level = filters.level;
    }
    if (filters.salaryMin || filters.salaryMax) {
      where.AND = [];
      if (filters.salaryMin) {
        (where.AND as Record<string, unknown>[]).push({
          OR: [
            { salaryMax: { gte: filters.salaryMin } },
            { salaryMin: { gte: filters.salaryMin } },
          ],
        });
      }
      if (filters.salaryMax) {
        (where.AND as Record<string, unknown>[]).push({
          salaryMin: { lte: filters.salaryMax },
        });
      }
    }

    where.status = "ACTIVE";

    const page = filters.page;
    const limit = filters.limit;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where: where as any,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          recruiter: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
        },
      }),
      prisma.jobListing.count({ where: where as any }),
    ]);

    // ponytail: in-memory boost sort; raw SQL CASE WHEN if this becomes a bottleneck
    const now = new Date();
    const sorted = [...jobs].sort((a, b) => {
      const scoreA =
        a.isFeatured && a.featuredExpiresAt && a.featuredExpiresAt > now
          ? 2
          : a.isUrgent && a.urgentExpiresAt && a.urgentExpiresAt > now
            ? 1
            : 0;
      const scoreB =
        b.isFeatured && b.featuredExpiresAt && b.featuredExpiresAt > now
          ? 2
          : b.isUrgent && b.urgentExpiresAt && b.urgentExpiresAt > now
            ? 1
            : 0;
      return scoreB - scoreA || b.createdAt.getTime() - a.createdAt.getTime();
    });

    return {
      data: sorted.map((j) => formatJob(j)),
      meta: { total, page, limit },
    };
  },

  async getJob(id: string, userId?: string) {
    const include: Record<string, unknown> = {
      recruiter: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
      _count: { select: { applications: true } },
    };

    if (userId) {
      include.bookmarks = { where: { userId }, select: { id: true } };
    }

    const job = await prisma.jobListing.findUnique({
      where: { id },
      include: include as any,
    });

    if (!job) {
      throw new AppError(404, "NOT_FOUND", "Job not found");
    }

    // Calculate skill match score if user is authenticated
    let matchScore: number | undefined;
    if (userId) {
      const userSkills = await prisma.endorsement.findMany({
        where: { endorsedId: userId },
        include: { skill: { select: { name: true } } },
      });
      const endorsedNames = new Set(userSkills.map((e) => e.skill.name));
      const jobSkills = (job.skills as string[]) ?? [];
      if (jobSkills.length > 0) {
        const matches = jobSkills.filter((s) => endorsedNames.has(s)).length;
        matchScore = Math.round((matches / jobSkills.length) * 100);
      }
    }

    const result = {
      ...job,
      _applicationsCount: (job as any)._count.applications,
      _bookmarked: (job as any).bookmarks
        ? (job as any).bookmarks.length > 0
        : undefined,
      _matchScore: matchScore,
    };

    const formatted = formatJob(result, userId);
    const metrics = await jobService.getRecruiterMetrics(job.recruiterId);

    return { job: { ...formatted, ...metrics } };
  },

  async updateJob(id: string, recruiterId: string, data: UpdateJobInput) {
    const job = await prisma.jobListing.findUnique({
      where: { id },
      select: { recruiterId: true },
    });
    if (!job) {
      throw new AppError(404, "NOT_FOUND", "Job not found");
    }
    if (job.recruiterId !== recruiterId) {
      throw new AppError(403, "FORBIDDEN", "Not your job listing");
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax;
    if (data.salaryCurrency !== undefined)
      updateData.salaryCurrency = data.salaryCurrency;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.jobListing.update({
      where: { id },
      data: updateData,
      include: {
        recruiter: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
      },
    });

    return { job: formatJob(updated) };
  },

  async deleteJob(id: string, recruiterId: string) {
    const job = await prisma.jobListing.findUnique({
      where: { id },
      select: { recruiterId: true },
    });
    if (!job) {
      throw new AppError(404, "NOT_FOUND", "Job not found");
    }
    if (job.recruiterId !== recruiterId) {
      throw new AppError(403, "FORBIDDEN", "Not your job listing");
    }
    await prisma.jobListing.delete({ where: { id } });
  },

  async toggleBookmark(userId: string, jobId: string) {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!job) {
      throw new AppError(404, "NOT_FOUND", "Job not found");
    }

    const existing = await prisma.bookmark.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await prisma.bookmark.create({ data: { userId, jobId } });
    return { bookmarked: true };
  },

  async getBookmarks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          job: {
            include: {
              recruiter: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
            },
          },
        },
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    const jobs = bookmarks.map((b) => ({
      ...b.job,
      _bookmarked: true,
    }));

    return {
      data: jobs.map((j) => formatJob(j as any)),
      meta: { total, page, limit },
    };
  },

  async applyForJob(
    jobId: string,
    applicantId: string,
    resumeUrl: string,
    coverLetter?: string
  ) {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        recruiterId: true,
        title: true,
      },
    });
    if (!job) {
      throw new AppError(404, "NOT_FOUND", "Job not found");
    }
    if (job.status !== "ACTIVE") {
      throw new AppError(
        400,
        "JOB_NOT_ACTIVE",
        "Job is not accepting applications"
      );
    }
    if (job.recruiterId === applicantId) {
      throw new AppError(
        400,
        "CANNOT_APPLY_TO_OWN_JOB",
        "You cannot apply to your own job"
      );
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_applicantId: { jobId, applicantId } },
    });
    if (existing) {
      throw new AppError(
        409,
        "ALREADY_APPLIED",
        "You already applied to this job"
      );
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        applicantId,
        resumeUrl,
        coverLetter: coverLetter ?? null,
      },
      include: {
        job: { select: { id: true, title: true } },
        applicant: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    await notificationService.createNotification(
      job.recruiterId,
      "NEW_APPLICANT",
      "New Applicant",
      `Someone applied to "${job.title}"`,
      `/jobs/${jobId}/applications`
    );

    return { application: formatApplication(application) };
  },

  async getApplications(jobId: string, recruiterId: string, level?: string) {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { recruiterId: true },
    });
    if (!job) {
      throw new AppError(404, "NOT_FOUND", "Job not found");
    }
    if (job.recruiterId !== recruiterId) {
      throw new AppError(403, "FORBIDDEN", "Not your job listing");
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      include: {
        job: { select: { id: true, title: true } },
        applicant: {
          select: { id: true, name: true, email: true, avatar: true, profile: { select: { experience: true } } },
        },
      },
    });

    const enriched = applications.map((app) => {
      const exp = app.applicant.profile?.experience;
      let totalYears = 0;
      if (exp) {
        const entries = typeof exp === "string" ? JSON.parse(exp) : exp;
        for (const entry of entries) {
          if (entry.startDate && entry.endDate) {
            const start = new Date(entry.startDate);
            const end = new Date(entry.endDate);
            totalYears += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          }
        }
      }
      let estimatedLevel = "JUNIOR";
      if (totalYears > 2) estimatedLevel = "MID";
      if (totalYears > 5) estimatedLevel = "SENIOR";
      if (totalYears > 10) estimatedLevel = "LEAD";
      return { ...formatApplication(app as any), estimatedLevel, totalYearsExp: Math.round(totalYears) };
    });

    const filtered = level ? enriched.filter((a) => a.estimatedLevel === level) : enriched;
    return { applications: filtered };
  },

  async getUserApplications(userId: string) {
    const applications = await prisma.application.findMany({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        job: { select: { id: true, title: true } },
        applicant: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return { applications: applications.map(formatApplication) };
  },

  async getApplicationTimeline(applicationId: string, userId: string) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { select: { recruiterId: true, title: true } } },
    });
    if (!app) throw new AppError(404, "NOT_FOUND", "Application not found");

    const isApplicant = app.applicantId === userId;
    const isRecruiter = app.job.recruiterId === userId;
    if (!isApplicant && !isRecruiter) {
      throw new AppError(403, "FORBIDDEN", "Not your application");
    }

    const history = await prisma.applicationStatusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    });

    return {
      timeline: history.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  },

  async updateApplicationStatus(
    id: string,
    recruiterId: string,
    status: string
  ) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: { select: { recruiterId: true, title: true } },
        applicant: { select: { id: true } },
      },
    });
    if (!application) {
      throw new AppError(404, "NOT_FOUND", "Application not found");
    }
    if (application.job.recruiterId !== recruiterId) {
      throw new AppError(403, "FORBIDDEN", "Not your job listing");
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: status as any },
      include: {
        job: { select: { id: true, title: true } },
        applicant: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Track status change in timeline
    await prisma.applicationStatusHistory.create({
      data: { applicationId: id, status: status as any, note: null },
    });

    await notificationService.createNotification(
      application.applicant.id,
      "APPLICATION_UPDATE",
      "Application Updated",
      `Your application for "${application.job.title}" is now ${status.toLowerCase()}`,
      `/applications/${id}`
    );

    return { application: formatApplication(updated) };
  },

  async getRecruiterMetrics(recruiterId: string) {
    const [totalHires, activeJobs, lastActivity] = await Promise.all([
      prisma.application.count({
        where: { job: { recruiterId }, status: "HIRED" },
      }),
      prisma.jobListing.count({
        where: { recruiterId, status: "ACTIVE" },
      }),
      prisma.activityLog.findFirst({
        where: { viewerId: recruiterId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    // Average response days: query applications where status changed from PENDING
    const pendingApps = await prisma.application.findMany({
      where: { job: { recruiterId }, status: { not: "PENDING" } },
      select: { createdAt: true, updatedAt: true },
    });

    let avgResponseDays: number | null = null;
    if (pendingApps.length > 0) {
      const totalDays = pendingApps.reduce((sum, app) => {
        const diff = app.updatedAt.getTime() - app.createdAt.getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      avgResponseDays = Math.round((totalDays / pendingApps.length) * 10) / 10;
    }

    return {
      avgResponseDays,
      totalHires,
      activeJobs,
      lastActive: lastActivity?.createdAt.toISOString() ?? null,
    };
  },
};
