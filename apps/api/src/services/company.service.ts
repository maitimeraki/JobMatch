import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";

export const companyService = {
  async getOrCreate(recruiterId: string, data: {
    companyName: string;
    logo?: string;
    website?: string;
    description?: string;
    size?: string;
    industry?: string;
    location?: string;
  }) {
    const existing = await prisma.companyProfile.findUnique({ where: { recruiterId } });
    if (existing) {
      return prisma.companyProfile.update({ where: { recruiterId }, data });
    }
    return prisma.companyProfile.create({ data: { ...data, recruiterId } });
  },

  async getByRecruiter(recruiterId: string) {
    const company = await prisma.companyProfile.findUnique({
      where: { recruiterId },
      include: {
        recruiter: {
          include: {
            jobsPosted: {
              where: { status: "ACTIVE" },
              select: { id: true, title: true, location: true, type: true, level: true, salaryMin: true, salaryMax: true, salaryCurrency: true, skills: true, createdAt: true },
            },
          },
        },
      },
    });
    if (!company) return null;
    const { recruiter, ...rest } = company;
    return { ...rest, jobs: recruiter.jobsPosted };
  },

  async update(recruiterId: string, data: any) {
    const company = await prisma.companyProfile.findUnique({ where: { recruiterId } });
    if (!company) throw new AppError(404, "NOT_FOUND", "Company profile not found");
    return prisma.companyProfile.update({ where: { recruiterId }, data });
  },
};
