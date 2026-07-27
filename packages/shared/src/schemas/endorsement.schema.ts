import { z } from "zod";

export const createEndorsementSchema = z.object({
  endorsedId: z.string().uuid(),
  skillId: z.string().uuid(),
  postId: z.string().uuid().optional().nullable(),
});

export const createReferralSchema = z.object({
  connectorId: z.string().uuid(),
  jobId: z.string().uuid().optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export type CreateEndorsementInput = z.infer<typeof createEndorsementSchema>;
export type CreateReferralInput = z.infer<typeof createReferralSchema>;
