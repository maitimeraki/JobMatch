import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service.js";

export const notificationController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await notificationService.getNotifications(
        req.user!.id,
        page,
        limit
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.id);
      res.json({
        success: true,
        data: { message: "Notification marked as read" },
      });
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.json({
        success: true,
        data: { message: "All notifications marked as read" },
      });
    } catch (error) {
      next(error);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUnreadCount(req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
