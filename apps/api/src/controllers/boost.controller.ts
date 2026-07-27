import { Request, Response, NextFunction } from "express";
import { boostService } from "../services/boost.service.js";
import { payoutService } from "../services/payout.service.js";

export const boostController = {
  async purchaseBoost(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.body;
      const result = await boostService.purchaseBoost(
        req.user!.id,
        req.params.id,
        type
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getActiveBoosts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await boostService.getActiveBoosts(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async setReferralBonus(req: Request, res: Response, next: NextFunction) {
    try {
      const { bonusCents } = req.body;
      const result = await payoutService.setReferralBonus(
        req.user!.id,
        req.params.id,
        bonusCents
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
