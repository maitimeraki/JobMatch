import prisma from "../config/db.js";

interface SkillGapResult {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  recommendations: {
    skill: string;
    demandLevel: "high" | "medium" | "low";
  }[];
}

export const skillGapService = {
  async analyze(seekerId: string, targetJobId?: string): Promise<SkillGapResult> {
    const seeker = await prisma.user.findUnique({
      where: { id: seekerId },
      include: { profile: { select: { skills: true } } },
    });

    const seekerSkills = seeker?.profile?.skills ?? [];

    let targetSkills: string[] = [];
    let allActiveSkills: string[] = [];

    if (targetJobId) {
      const job = await prisma.jobListing.findUnique({
        where: { id: targetJobId },
        select: { skills: true },
      });
      if (job) targetSkills = job.skills;
    }

    // Aggregate skills from all active jobs for demand analysis
    const activeJobs = await prisma.jobListing.findMany({
      where: { status: "ACTIVE" },
      select: { skills: true },
    });
    allActiveSkills = activeJobs.flatMap((j) => j.skills);

    const skillsToCompare = targetSkills.length > 0
      ? targetSkills
      : [...new Set(allActiveSkills)];

    const matchedSkills = skillsToCompare.filter((s) => seekerSkills.includes(s));
    const missingSkills = skillsToCompare.filter((s) => !seekerSkills.includes(s));

    const matchPercentage = skillsToCompare.length > 0
      ? Math.round((matchedSkills.length / skillsToCompare.length) * 100)
      : 0;

    // Calculate demand level for each missing skill
    const skillCounts = new Map<string, number>();
    for (const skills of activeJobs.map((j) => j.skills)) {
      for (const skill of skills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
    }

    const totalJobs = activeJobs.length;
    const recommendations = missingSkills.map((skill) => {
      const count = skillCounts.get(skill) || 0;
      const ratio = totalJobs > 0 ? count / totalJobs : 0;
      const demandLevel: "high" | "medium" | "low" =
        ratio >= 0.3 ? "high" : ratio >= 0.1 ? "medium" : "low";
      return { skill, demandLevel };
    });

    return { matchedSkills, missingSkills, matchPercentage, recommendations };
  },
};
