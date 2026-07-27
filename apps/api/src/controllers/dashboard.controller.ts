import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { matchAlertService } from "../services/match-alert.service.js";

export const dashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getStats(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getPipeline(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getTalentPool(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = req.query.jobId as string | undefined;
      const result = await dashboardService.getTalentPool(req.user!.id, jobId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getMostEngaged(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getMostEngaged();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getMatchAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await matchAlertService.getRecentMatches(req.user!.id, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
