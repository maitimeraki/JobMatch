import { Router } from "express";
import { referralController } from "../controllers/referral.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createReferralSchema } from "@jobmatch/shared";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createReferralSchema),
  referralController.create
);
router.get("/sent", authenticate, referralController.getSent);
router.get("/received", authenticate, referralController.getReceived);
router.patch("/:id/accept", authenticate, referralController.accept);
router.patch("/:id/decline", authenticate, referralController.decline);

export default router;
