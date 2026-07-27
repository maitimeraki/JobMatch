import { Router } from "express";
import { endorsementController } from "../controllers/endorsement.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createEndorsementSchema } from "@jobmatch/shared";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createEndorsementSchema),
  endorsementController.create
);
router.get("/skills", authenticate, endorsementController.getSkills);

export default router;
