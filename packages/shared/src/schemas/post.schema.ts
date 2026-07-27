import { z } from "zod";

export const postCategoryEnum = z.enum([
  "PROJECT_SHOWCASE",
  "LEARNING",
  "QUESTION",
  "ACHIEVEMENT",
  "DISCUSSION",
]);

export const createPostSchema = z.object({
  content: z.string().min(1, "Content required").max(5000),
  category: postCategoryEnum.default("DISCUSSION"),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Content required").max(1000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
