import { Router, Request, Response, NextFunction } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import prisma from "../config/db.js";

const router = Router();

router.post(
  "/verify-recruiter/:userId",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, recruiterPlan: true },
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
        return;
      }
      if (user.role !== "RECRUITER") {
        res.status(400).json({ success: false, error: { code: "INVALID_ROLE", message: "User is not a recruiter" } });
        return;
      }

      const plan = await prisma.recruiterPlan.upsert({
        where: { recruiterId: userId },
        update: { verified, verifiedAt: verified ? new Date() : null },
        create: { recruiterId: userId, verified, verifiedAt: verified ? new Date() : null },
      });

      res.json({ success: true, data: { verified: plan.verified, verifiedAt: plan.verifiedAt?.toISOString() ?? null } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
