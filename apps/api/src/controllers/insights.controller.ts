import { Request, Response, NextFunction } from "express";
import { insightsService } from "../services/insights.service.js";

export const insightsController = {
  async purchasePremium(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await insightsService.purchasePremium(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getApplicationInsights(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await insightsService.getApplicationInsights(
        req.user!.id,
        req.params.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
