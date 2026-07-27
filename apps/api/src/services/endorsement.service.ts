import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { notificationService } from "./notification.service.js";

export const endorsementService = {
  async createEndorsement(
    endorserId: string,
    endorsedId: string,
    skillId: string,
    postId?: string | null
  ) {
    if (endorserId === endorsedId) {
      throw new AppError(400, "BAD_REQUEST", "Cannot endorse yourself");
    }

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) {
      throw new AppError(404, "NOT_FOUND", "Skill not found");
    }

    const endorsedUser = await prisma.user.findUnique({
      where: { id: endorsedId },
    });
    if (!endorsedUser) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }

    const existing = await prisma.endorsement.findUnique({
      where: {
        endorserId_endorsedId_skillId: { endorserId, endorsedId, skillId },
      },
    });

    if (existing) {
      throw new AppError(409, "CONFLICT", "Already endorsed this skill");
    }

    const endorsement = await prisma.endorsement.create({
      data: { endorserId, endorsedId, skillId, postId: postId ?? null },
      include: {
        skill: { select: { id: true, name: true } },
        endorser: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.profile.upsert({
      where: { userId: endorsedId },
      update: { communityScore: { increment: 3 } },
      create: { userId: endorsedId, communityScore: 3 },
    });

    await notificationService.createNotification(
      endorsedId,
      "POST_ENDORSED",
      "New Endorsement",
      `${endorsement.endorser.name} endorsed your ${endorsement.skill.name} skill`,
      "/profile"
    );

    return {
      endorsement: {
        id: endorsement.id,
        skill: endorsement.skill,
        endorser: endorsement.endorser,
        createdAt: endorsement.createdAt.toISOString(),
      },
    };
  },

  async getSkills() {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    return { skills };
  },

  async getUserEndorsements(userId: string) {
    const endorsements = await prisma.endorsement.findMany({
      where: { endorsedId: userId },
      include: {
        skill: { select: { id: true, name: true } },
        endorser: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const grouped: Record<
      string,
      {
        skill: { id: string; name: string };
        endorsements: Array<{
          id: string;
          endorser: { id: string; name: string; avatar: string | null };
          createdAt: string;
        }>;
      }
    > = {};

    for (const e of endorsements) {
      if (!grouped[e.skill.id]) {
        grouped[e.skill.id] = { skill: e.skill, endorsements: [] };
      }
      grouped[e.skill.id].endorsements.push({
        id: e.id,
        endorser: e.endorser,
        createdAt: e.createdAt.toISOString(),
      });
    }

    return {
      endorsements: Object.values(grouped).map((g) => ({
        skill: g.skill,
        count: g.endorsements.length,
        endorsements: g.endorsements,
      })),
    };
  },

  async seedSkills() {
    const skillNames = [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Python",
      "Java",
      "Go",
      "Rust",
      "PostgreSQL",
      "MongoDB",
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "GraphQL",
      "REST APIs",
      "CSS",
      "HTML",
      "Git",
      "CI/CD",
      "Agile",
      "Scrum",
      "Project Management",
      "UI/UX Design",
      "Figma",
      "Machine Learning",
      "Data Analysis",
      "DevOps",
    ];

    const skills = [];
    for (const name of skillNames) {
      const skill = await prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      skills.push(skill);
    }

    return { skills };
  },
};
