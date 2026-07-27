import { Router } from "express";
import { postController } from "../controllers/post.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPostSchema, createCommentSchema } from "@jobmatch/shared";

const router = Router();

router.get("/", authenticate, postController.getFeed);
router.post(
  "/",
  authenticate,
  validate(createPostSchema),
  postController.create
);
router.get("/:id", authenticate, postController.getPost);
router.delete("/:id", authenticate, postController.delete);
router.post("/:id/like", authenticate, postController.toggleLike);
router.post(
  "/:id/comment",
  authenticate,
  validate(createCommentSchema),
  postController.addComment
);
router.get("/:id/comments", authenticate, postController.getComments);

export default router;
