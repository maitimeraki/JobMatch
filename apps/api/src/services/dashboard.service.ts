import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";

interface ApplicationOverTime {
  date: string;
  count: number;
}

interface SourceBreakdown {
  source: string;
  count: number;
}

interface HiringFunnelEntry {
  status: string;
  count: number;
}

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  avgTimeToHire: number | null;
  referralHires: number;
  applicationsOverTime: ApplicationOverTime[];
  sourceBreakdown: SourceBreakdown[];
  hiringFunnel: HiringFunnelEntry[];
}

interface PipelineApplicant {
  id: string;
  applicant: { id: string; name: string; avatar: string | null };
  headline: string | null;
  skills: string[];
  jobTitle: string;
  appliedDate: string;
  estimatedLevel: string;
  totalYearsExp: number;
}

interface PipelineGroup {
  status: string;
  applications: PipelineApplicant[];
}

interface TalentPoolCandidate {
  id: string;
  name: string;
  avatar: string | null;
  headline: string | null;
  skills: string[];
  matchingSkills: string[];
  matchScore: number;
  communityScore: number;
}

export const dashboardService = {
  async getStats(recruiterId: string): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeJobs, totalApplications, hiredApps, referralHires, recentApps, sourceGrouped, statusGrouped] =
      await Promise.all([
        prisma.jobListing.count({ where: { recruiterId, status: "ACTIVE" } }),
        prisma.application.count({ where: { job: { recruiterId } } }),
        prisma.application.findMany({
          where: { job: { recruiterId }, status: "HIRED" },
          select: { createdAt: true, updatedAt: true },
        }),
        prisma.application.count({
          where: { job: { recruiterId }, status: "HIRED", source: "REFERRAL" },
        }),
        prisma.application.findMany({
          where: { job: { recruiterId }, createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.application.groupBy({
          by: ["source"],
          where: { job: { recruiterId } },
          _count: true,
        }),
        prisma.application.groupBy({
          by: ["status"],
          where: { job: { recruiterId } },
          _count: true,
        }),
      ]);

    // Average time to hire in days
    const avgTimeToHire =
      hiredApps.length > 0
        ? Math.round(
            hiredApps.reduce((sum, app) => {
              const diff = app.updatedAt.getTime() - app.createdAt.getTime();
              return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) / hiredApps.length
          )
        : null;

    // Applications over last 30 days — fill missing dates with zero
    const dateMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      dateMap.set(d.toISOString().split("T")[0], 0);
    }
    for (const app of recentApps) {
      const key = app.createdAt.toISOString().split("T")[0];
      dateMap.set(key, (dateMap.get(key) || 0) + 1);
    }
    const applicationsOverTime: ApplicationOverTime[] = Array.from(
      dateMap.entries()
    ).map(([date, count]) => ({ date, count }));

    const sourceBreakdown: SourceBreakdown[] = sourceGrouped.map((g) => ({
      source: g.source,
      count: g._count,
    }));

    const hiringFunnel: HiringFunnelEntry[] = statusGrouped.map((g) => ({
      status: g.status,
      count: g._count,
    }));

    return {
      activeJobs,
      totalApplications,
      avgTimeToHire,
      referralHires,
      applicationsOverTime,
      sourceBreakdown,
      hiringFunnel,
    };
  },

  async getPipeline(recruiterId: string): Promise<PipelineGroup[]> {
    const applications = await prisma.application.findMany({
      where: { job: { recruiterId } },
      include: {
        applicant: {
          include: {
            profile: { select: { headline: true, skills: true, experience: true } },
          },
        },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const groups: Record<string, PipelineGroup> = {};

    for (const app of applications) {
      const status = app.status;
      if (!groups[status]) {
        groups[status] = { status, applications: [] };
      }

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

      groups[status].applications.push({
        id: app.id,
        applicant: {
          id: app.applicant.id,
          name: app.applicant.name,
          avatar: app.applicant.avatar,
        },
        headline: app.applicant.profile?.headline ?? null,
        skills: app.applicant.profile?.skills ?? [],
        jobTitle: app.job.title,
        appliedDate: app.createdAt.toISOString(),
        estimatedLevel,
        totalYearsExp: Math.round(totalYears),
      });
    }

    // Return in a consistent order matching the enum definition
    const statusOrder = ["PENDING", "REVIEWING", "SHORTLISTED", "HIRED", "REJECTED"];
    return statusOrder.filter((s) => groups[s]).map((s) => groups[s]);
  },

  async getTalentPool(
    recruiterId: string,
    jobId?: string
  ): Promise<{ candidates: TalentPoolCandidate[] }> {
    // Determine the required skills from the recruiter's jobs
    let requiredSkills: string[];

    if (jobId) {
      const job = await prisma.jobListing.findUnique({
        where: { id: jobId },
        select: { skills: true, recruiterId: true },
      });
      if (!job) {
        throw new AppError(404, "NOT_FOUND", "Job not found");
      }
      if (job.recruiterId !== recruiterId) {
        throw new AppError(403, "FORBIDDEN", "Not your job listing");
      }
      requiredSkills = job.skills;
    } else {
      const jobs = await prisma.jobListing.findMany({
        where: { recruiterId },
        select: { skills: true },
      });
      requiredSkills = [...new Set(jobs.flatMap((j: any) => j.skills ?? []))] as string[];
    }

    if (requiredSkills.length === 0) {
      return { candidates: [] };
    }

    // Fetch SEEKER users with their profiles and received endorsements
    const seekers = await prisma.user.findMany({
      where: { role: "SEEKER" },
      include: {
        profile: {
          select: { headline: true, skills: true, communityScore: true },
        },
        endorsementsReceived: {
          include: { skill: { select: { name: true } } },
        },
      },
    });

    const candidates: TalentPoolCandidate[] = [];

    for (const user of seekers) {
      if (!user.profile) continue;

      const endorsedSkillNames = new Set(
        user.endorsementsReceived.map((e) => e.skill.name)
      );

      const matchingSkills = user.profile.skills.filter(
        (s) => requiredSkills.includes(s) && endorsedSkillNames.has(s)
      );

      if (matchingSkills.length === 0) continue;

      candidates.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        headline: user.profile.headline ?? null,
        skills: user.profile.skills,
        matchingSkills,
        matchScore: matchingSkills.length,
        communityScore: user.profile.communityScore,
      });
    }

    candidates.sort((a, b) => b.matchScore - a.matchScore);
    return { candidates: candidates.slice(0, 20) };
  },

  async getMostEngaged() {
    const seekers = await prisma.user.findMany({
      where: { role: "SEEKER" },
      include: {
        profile: { select: { headline: true, skills: true, communityScore: true } },
        posts: { select: { _count: { select: { likes: true, comments: true } } } },
        _count: { select: { followsFollower: true } },
      },
    });

    const candidates = seekers
      .filter((u) => u.profile)
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        headline: u.profile!.headline ?? null,
        skills: u.profile!.skills,
        communityScore: u.profile!.communityScore,
        totalLikes: u.posts.reduce((sum, p) => sum + p._count.likes, 0),
        totalComments: u.posts.reduce((sum, p) => sum + p._count.comments, 0),
        followersCount: u._count.followsFollower,
      }))
      .sort((a, b) => b.communityScore - a.communityScore || b.totalLikes - a.totalLikes);

    return { data: candidates.slice(0, 10) };
  },
};
