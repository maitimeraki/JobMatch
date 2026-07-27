import { Request, Response, NextFunction } from "express";
import { referralService } from "../services/referral.service.js";

export const referralController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { connectorId, jobId, message } = req.body;
      const result = await referralService.createReferral(
        req.user!.id,
        connectorId,
        jobId,
        message
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getSent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await referralService.getSentRequests(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getReceived(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await referralService.getReceivedRequests(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await referralService.acceptRequest(
        req.params.id,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await referralService.declineRequest(
        req.params.id,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
