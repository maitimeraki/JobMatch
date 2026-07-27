import { Router } from "express";
import authRoutes from "./auth.routes.js";
import postRoutes from "./post.routes.js";
import jobRoutes from "./job.routes.js";
import userRoutes from "./user.routes.js";
import applicationRoutes from "./application.routes.js";
import notificationRoutes from "./notification.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import endorsementRoutes from "./endorsement.routes.js";
import referralRoutes from "./referral.routes.js";
import uploadRoutes from "./upload.routes.js";
import boostRoutes from "./boost.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import insightsRoutes from "./insights.routes.js";
import adminRoutes from "./admin.routes.js";
import shortlistRoutes from "./shortlist.routes.js";
import companyRoutes from "./company.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/jobs", jobRoutes);
router.use("/users", userRoutes);
router.use("/applications", applicationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/endorsements", endorsementRoutes);
router.use("/referrals", referralRoutes);
router.use("/upload", uploadRoutes);
router.use("/boosts", boostRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/insights", insightsRoutes);
router.use("/admin", adminRoutes);
router.use("/shortlist", shortlistRoutes);
router.use("/company", companyRoutes);

export default router;
