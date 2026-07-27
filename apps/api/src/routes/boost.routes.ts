import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { checkPlanLimit } from "../middleware/subscription.middleware.js";
import { boostController } from "../controllers/boost.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("RECRUITER"));

// Purchase a boost — pass { type: "FEATURED" | "URGENT" } in body
router.post("/:id/boost", boostController.purchaseBoost);
router.get("/:id/boosts", boostController.getActiveBoosts);
router.post("/:id/referral-bonus", boostController.setReferralBonus);

export default router;
