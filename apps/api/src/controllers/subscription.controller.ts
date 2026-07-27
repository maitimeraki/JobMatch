import { Request, Response, NextFunction } from "express";
import { subscriptionService } from "../services/subscription.service.js";

export const subscriptionController = {
  async getPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await subscriptionService.getOrCreatePlan(req.user!.id);
      const limits = await subscriptionService.getLimits(req.user!.id);
      res.json({ success: true, data: { plan, limits } });
    } catch (error) {
      next(error);
    }
  },

  async upgrade(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.upgradeToPro(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async downgrade(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.downgradeToFree(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
