import { Request, Response, NextFunction } from "express";
import { shortlistService } from "../services/shortlist.service.js";

export const shortlistController = {
  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateId, jobId } = req.body;
      if (!candidateId) {
        res.status(400).json({ success: false, error: { code: "MISSING_CANDIDATE", message: "candidateId is required" } });
        return;
      }
      const result = await shortlistService.toggleShortlist(req.user!.id, candidateId, jobId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const jobId = req.query.jobId as string | undefined;
      const result = await shortlistService.getShortlisted(req.user!.id, jobId, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateId } = req.params;
      const { note } = req.body;
      const result = await shortlistService.updateNote(req.user!.id, candidateId, note);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateId } = req.params;
      const result = await shortlistService.getNote(req.user!.id, candidateId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = req.query.jobId as string | undefined;
      const csv = await shortlistService.exportShortlistCsv(req.user!.id, jobId);
      const date = new Date().toISOString().split("T")[0];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="shortlist-${date}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};
