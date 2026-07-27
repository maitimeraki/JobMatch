import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { insightsController } from "../controllers/insights.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/applications/:id/insights",
  requireRole("SEEKER"),
  insightsController.getApplicationInsights
);

router.post("/premium", requireRole("SEEKER"), insightsController.purchasePremium);

export default router;
