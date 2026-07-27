import { Router } from "express";
import { jobController } from "../controllers/job.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { checkPlanLimit } from "../middleware/subscription.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createJobSchema, updateJobSchema } from "@jobmatch/shared";

const router = Router();

router.get("/", authenticate, jobController.search);
router.post(
  "/",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  checkPlanLimit("MAX_ACTIVE_JOBS"),
  validate(createJobSchema),
  jobController.create
);
router.get("/bookmarks/list", authenticate, jobController.getBookmarks);
router.get("/:id", authenticate, jobController.getById);
router.patch(
  "/:id",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  validate(updateJobSchema),
  jobController.update
);
router.delete(
  "/:id",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  jobController.delete
);
router.post("/:id/apply", authenticate, jobController.apply);
router.post("/:id/bookmark", authenticate, jobController.toggleBookmark);
router.get(
  "/:id/applications",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  jobController.getApplications
);
router.get(
  "/:id/talent-pool",
  authenticate,
  requireRole("RECRUITER", "ADMIN"),
  jobController.getTalentPool
);
router.get(
  "/:id/analytics",
  authenticate,
  requireRole("RECRUITER"),
  jobController.getAnalytics
);

export default router;
