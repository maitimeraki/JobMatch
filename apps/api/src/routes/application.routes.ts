import { Router } from "express";
import { jobController } from "../controllers/job.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, jobController.getUserApplications);
router.get("/:id/timeline", authenticate, jobController.getTimeline);
router.patch("/:id/status", authenticate, requireRole("RECRUITER", "ADMIN"), jobController.updateStatus);

export default router;
