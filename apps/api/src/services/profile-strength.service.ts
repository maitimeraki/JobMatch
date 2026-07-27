import prisma from "../config/db.js";

interface CheckItem {
  label: string;
  completed: boolean;
  points: number;
  pointsAwarded: number;
}

interface ProfileStrengthResult {
  score: number;
  items: CheckItem[];
  nextStep: string | null;
}

export const profileStrengthService = {
  async calculate(userId: string): Promise<ProfileStrengthResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        posts: {
          where: { category: "PROJECT_SHOWCASE" },
          take: 1,
          select: { id: true },
        },
      },
    });

    if (!user) throw new Error("User not found");

    const p = user.profile;
    const skillsCount = p?.skills?.length ?? 0;
    const expCount = Array.isArray(p?.experience) ? (p.experience as unknown[]).length : 0;
    const eduCount = Array.isArray(p?.education) ? (p.education as unknown[]).length : 0;

    const items: CheckItem[] = [
      { label: "Add a bio", completed: !!p?.bio, points: 10, pointsAwarded: p?.bio ? 10 : 0 },
      { label: "Add a headline", completed: !!p?.headline, points: 10, pointsAwarded: p?.headline ? 10 : 0 },
      { label: "Add your location", completed: !!p?.location, points: 5, pointsAwarded: p?.location ? 5 : 0 },
      { label: "Upload a resume", completed: !!p?.resumeUrl, points: 20, pointsAwarded: p?.resumeUrl ? 20 : 0 },
      {
        label: skillsCount >= 3 ? "Add at least 3 skills" : "Add skills",
        completed: skillsCount >= 3,
        points: 15,
        pointsAwarded: skillsCount >= 3 ? 15 : skillsCount >= 1 ? 5 : 0,
      },
      { label: "Add work experience", completed: expCount >= 1, points: 15, pointsAwarded: expCount >= 1 ? 15 : 0 },
      { label: "Add education", completed: eduCount >= 1, points: 10, pointsAwarded: eduCount >= 1 ? 10 : 0 },
      { label: "Add a profile picture", completed: !!user.avatar, points: 10, pointsAwarded: user.avatar ? 10 : 0 },
      { label: "Share a project showcase", completed: user.posts.length > 0, points: 5, pointsAwarded: user.posts.length > 0 ? 5 : 0 },
    ];

    const score = items.reduce((sum, i) => sum + i.pointsAwarded, 0);

    const firstIncomplete = items.find((i) => !i.completed);
    let nextStep: string | null = null;
    if (firstIncomplete) {
      const pts = items.filter((i) => i.completed).reduce((s, i) => s + i.pointsAwarded, 0);
      nextStep = `${firstIncomplete.label} to reach ${pts + firstIncomplete.points}%`;
    }

    return { score, items, nextStep };
  },
};
