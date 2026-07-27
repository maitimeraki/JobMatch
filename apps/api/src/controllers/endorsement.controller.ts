import { Request, Response, NextFunction } from "express";
import { endorsementService } from "../services/endorsement.service.js";

export const endorsementController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await endorsementService.createEndorsement(
        req.user!.id,
        req.body.endorsedId,
        req.body.skillId,
        req.body.postId ?? null
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getSkills(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await endorsementService.getSkills();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUserEndorsements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await endorsementService.getUserEndorsements(
        req.params.id
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
