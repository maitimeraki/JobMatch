import { Router } from "express";
import { shortlistController } from "../controllers/shortlist.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/toggle", authenticate, requireRole("RECRUITER"), shortlistController.toggle);
router.get("/", authenticate, requireRole("RECRUITER"), shortlistController.list);
router.get("/export", authenticate, requireRole("RECRUITER"), shortlistController.exportCsv);
router.patch("/:candidateId/note", authenticate, requireRole("RECRUITER"), shortlistController.updateNote);
router.get("/:candidateId/note", authenticate, requireRole("RECRUITER"), shortlistController.getNote);

export default router;
