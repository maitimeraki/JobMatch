import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(
        req.body.email,
        req.body.password
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Refresh token required",
          },
        });
        return;
      }
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(_req: Request, res: Response) {
    res.json({ success: true, data: { message: "Logged out successfully" } });
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
