import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: z.string().url().optional().nullable(),
  skills: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        startDate: z.string(),
        endDate: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        school: z.string(),
        year: z.number().int(),
      })
    )
    .optional(),
  resumeUrl: z.string().optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  currentRole: z.string().max(200).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
