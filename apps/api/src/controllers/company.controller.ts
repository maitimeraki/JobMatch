import { Request, Response, NextFunction } from "express";
import { companyService } from "../services/company.service.js";

export const companyController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.getByRecruiter(req.params.recruiterId);
      if (!result) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Company not found" } });
        return;
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.getOrCreate(req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.update(req.user!.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
