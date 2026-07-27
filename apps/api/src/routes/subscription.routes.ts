import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { subscriptionController } from "../controllers/subscription.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("RECRUITER"));

router.get("/plan", subscriptionController.getPlan);
router.post("/upgrade", subscriptionController.upgrade);
router.post("/downgrade", subscriptionController.downgrade);

export default router;
