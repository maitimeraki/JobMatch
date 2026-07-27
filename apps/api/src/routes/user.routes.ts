import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { endorsementController } from "../controllers/endorsement.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema } from "@jobmatch/shared";

const router = Router();

router.get("/search", authenticate, userController.search);
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  userController.updateProfile
);
router.get("/:id/profile", authenticate, userController.getProfile);
router.post("/:id/follow", authenticate, userController.follow);
router.get("/:id/followers", authenticate, userController.getFollowers);
router.get("/:id/following", authenticate, userController.getFollowing);
router.get(
  "/:id/endorsements",
  authenticate,
  endorsementController.getUserEndorsements
);
router.get(
  "/:id/mutual-connections",
  authenticate,
  userController.getMutualConnections
);
router.get(
  "/:id/profile-strength",
  authenticate,
  userController.getProfileStrength
);
router.get(
  "/:id/skill-gaps",
  authenticate,
  userController.getSkillGaps
);

export default router;
