import { Router } from "express";
import { companyController } from "../controllers/company.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { checkPlanLimit } from "../middleware/subscription.middleware.js";

const router = Router();

router.get("/:recruiterId", companyController.get);
router.post("/", authenticate, requireRole("RECRUITER"), checkPlanLimit("CAN_FEATURE_JOB"), companyController.upsert);
router.put("/", authenticate, requireRole("RECRUITER"), checkPlanLimit("CAN_FEATURE_JOB"), companyController.update);

export default router;
