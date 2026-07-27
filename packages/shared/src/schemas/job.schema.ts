import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  description: z.string().min(1, "Description required").max(10000),
  location: z.string().min(1, "Location required").max(200),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]).default("FULL_TIME"),
  level: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).default("MID"),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  salaryCurrency: z.string().default("USD"),
  skills: z.array(z.string()).default([]),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED", "DRAFT"]).optional(),
});

export const jobSearchSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]).optional(),
  level: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).optional(),
  remote: z.coerce.boolean().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
