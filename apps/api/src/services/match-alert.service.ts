import prisma from "../config/db.js";

export const matchAlertService = {
  async checkNewMatches(seekerId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId: seekerId },
      select: { skills: true },
    });
    if (!profile || profile.skills.length === 0) return;

    const seeker = await prisma.user.findUnique({
      where: { id: seekerId },
      select: { name: true },
    });
    if (!seeker) return;

    const skillSet = new Set(profile.skills.map((s) => s.toLowerCase()));

    // Find active jobs with overlapping skills
    const matchingJobs = await prisma.jobListing.findMany({
      where: {
        status: "ACTIVE",
        skills: { hasSome: profile.skills },
      },
      select: {
        id: true,
        title: true,
        recruiterId: true,
        skills: true,
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const job of matchingJobs) {
      const matchedSkills = job.skills.filter((s) => skillSet.has(s.toLowerCase()));

      // Debounce: skip if already notified in last 7 days
      const existing = await prisma.notification.findFirst({
        where: {
          userId: job.recruiterId,
          type: "JOB_RECOMMENDATION",
          message: { contains: job.title },
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: job.recruiterId,
          type: "JOB_RECOMMENDATION",
          title: "New Candidate Match",
          message: `${seeker.name} matched your ${job.title} role`,
          link: `/profile/${seekerId}`,
        },
      });
    }
  },

  async getRecentMatches(recruiterId: string, limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: recruiterId,
        type: "JOB_RECOMMENDATION",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Group by job (infer from message text)
    const grouped: Record<string, { jobTitle: string; seekers: { name: string; link: string }[] }> = {};
    for (const n of notifications) {
      const match = n.message.match(/(.+) matched your (.+) role/);
      if (!match) continue;
      const seekerName = match[1];
      const jobTitle = match[2];
      if (!grouped[jobTitle]) {
        grouped[jobTitle] = { jobTitle, seekers: [] };
      }
      grouped[jobTitle].seekers.push({ name: seekerName, link: n.link ?? "" });
    }

    return Object.values(grouped);
  },
};
