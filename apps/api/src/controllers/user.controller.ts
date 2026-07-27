import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service.js";
import { insightsService } from "../services/insights.service.js";
import { profileStrengthService } from "../services/profile-strength.service.js";
import { skillGapService } from "../services/skill-gap.service.js";

export const userController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      const result = await userService.getProfile(userId);

      // Log recruiter profile views for premium insights
      if (req.user && req.user.role === "RECRUITER" && req.user.id !== userId) {
        const jobId = req.query.jobId as string | undefined;
        insightsService.logProfileView(req.user.id, userId, jobId).catch(() => {});
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async follow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.followUser(req.user!.id, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await userService.getFollowers(req.params.id, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await userService.getFollowing(req.params.id, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || "";
      const role = req.query.role as string | undefined;
      const result = await userService.searchUsers(query, role);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getMutualConnections(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getMutualConnections(
        req.user!.id,
        req.params.id
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getProfileStrength(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await profileStrengthService.calculate(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getSkillGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = req.query.jobId as string | undefined;
      const result = await skillGapService.analyze(req.params.id, jobId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
