import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";

function calcTotalYears(experience: any): number {
  if (!experience) return 0;
  const entries = typeof experience === "string" ? JSON.parse(experience) : experience;
  let total = 0;
  for (const entry of entries) {
    if (entry.startDate && entry.endDate) {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      total += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    }
  }
  return total;
}

function estimateLevel(totalYears: number): string {
  if (totalYears <= 2) return "JUNIOR";
  if (totalYears <= 5) return "MID";
  if (totalYears <= 10) return "SENIOR";
  return "LEAD";
}

export const jobAnalyticsService = {
  async getJobAnalytics(jobId: string, recruiterId: string) {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { recruiterId: true, skills: true },
    });
    if (!job) throw new AppError(404, "NOT_FOUND", "Job not found");
    if (job.recruiterId !== recruiterId) throw new AppError(403, "FORBIDDEN", "Not your job listing");

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: {
          include: { profile: { select: { skills: true, experience: true } } },
        },
      },
    });

    const totalApplicants = applications.length;

    // Experience distribution
    const levelCounts: Record<string, number> = { JUNIOR: 0, MID: 0, SENIOR: 0, LEAD: 0 };
    for (const app of applications) {
      const totalYears = calcTotalYears(app.applicant.profile?.experience);
      const level = estimateLevel(totalYears);
      levelCounts[level]++;
    }
    const experienceDistribution = Object.entries(levelCounts)
      .filter(([, c]) => c > 0)
      .map(([level, count]) => ({
        level,
        count,
        percentage: totalApplicants > 0 ? Math.round((count / totalApplicants) * 100) : 0,
      }));

    // Skill coverage
    const jobSkills = job.skills ?? [];
    const skillsCoverage = jobSkills.map((skill) => {
      const matchCount = applications.filter(
        (app) => app.applicant.profile?.skills?.includes(skill)
      ).length;
      return {
        skill,
        matchCount,
        total: totalApplicants,
        percentage: totalApplicants > 0 ? Math.round((matchCount / totalApplicants) * 100) : 0,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // Applicant flow — last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      dateMap.set(d.toISOString().split("T")[0], 0);
    }
    for (const app of applications) {
      const key = app.createdAt.toISOString().split("T")[0];
      if (dateMap.has(key)) dateMap.set(key, (dateMap.get(key) || 0) + 1);
    }
    const applicantFlow = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));

    // Average skill match score
    const avgSkillMatch =
      totalApplicants > 0 && jobSkills.length > 0
        ? Math.round(
            applications.reduce((sum, app) => {
              const matched = jobSkills.filter(
                (s) => app.applicant.profile?.skills?.includes(s)
              ).length;
              return sum + matched / jobSkills.length;
            }, 0) / totalApplicants * 100
          )
        : 0;

    return {
      totalApplicants,
      experienceDistribution,
      skillsCoverage,
      applicantFlow,
      avgSkillMatch,
    };
  },
};
