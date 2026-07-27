import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/stats",
  authenticate,
  requireRole("RECRUITER"),
  dashboardController.getStats
);

router.get(
  "/pipeline",
  authenticate,
  requireRole("RECRUITER"),
  dashboardController.getPipeline
);

router.get(
  "/talent-pool",
  authenticate,
  requireRole("RECRUITER"),
  dashboardController.getTalentPool
);

router.get(
  "/most-engaged",
  authenticate,
  requireRole("RECRUITER"),
  dashboardController.getMostEngaged
);

router.get(
  "/match-alerts",
  authenticate,
  requireRole("RECRUITER"),
  dashboardController.getMatchAlerts
);

export default router;
