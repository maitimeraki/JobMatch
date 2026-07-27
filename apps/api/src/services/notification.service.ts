import prisma from "../config/db.js";
import { emitToUser } from "./socket.js";

type NotificationType =
  | "FOLLOW" | "LIKE" | "COMMENT" | "POST_ENDORSED"
  | "REFERRAL_REQUEST" | "REFERRAL_ACCEPTED" | "APPLICATION_UPDATE"
  | "NEW_APPLICANT" | "JOB_RECOMMENDATION" | "PROFILE_VIEWED"
  | "JOB_BOOSTED" | "PREMIUM_EXPIRING" | "PAYOUT_RECEIVED";

export const notificationService = {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, link: link ?? null },
    });
    const formatted = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      link: notification.link,
      createdAt: notification.createdAt.toISOString(),
    };
    emitToUser(userId, "notification", formatted);
    return notification;
  },

  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: { total, page, limit },
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) return;
    if (notification.userId !== userId) return;

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  },
};
