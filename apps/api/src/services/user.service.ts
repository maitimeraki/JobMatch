import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { notificationService } from "./notification.service.js";
import { matchAlertService } from "./match-alert.service.js";
import type { UpdateProfileInput, MutualConnection } from "@jobmatch/shared";

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, recruiterPlan: { select: { verified: true } } },
    });
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    // Recruiter activity stats (for seeker profiles)
    const [recruiterViews, shortlistCount] = await Promise.all([
      prisma.activityLog.count({ where: { targetId: userId } }),
      prisma.candidateShortlist.count({ where: { candidateId: userId } }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        profile: user.profile
          ? {
              id: user.profile.id,
              bio: user.profile.bio,
              headline: user.profile.headline,
              location: user.profile.location,
              website: user.profile.website,
              skills: user.profile.skills,
              experience: user.profile.experience as Record<string, unknown>[],
              education: user.profile.education as Record<string, unknown>[],
              resumeUrl: user.profile.resumeUrl,
              company: user.profile.company,
              currentRole: user.profile.currentRole,
              communityScore: user.profile.communityScore,
            }
          : null,
        followersCount,
        followingCount,
        isVerified: user.recruiterPlan?.verified ?? false,
        recruiterSearches: recruiterViews,
        recruiterActions: shortlistCount,
      },
    };
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }

    const profileData: Record<string, unknown> = {};
    if (data.bio !== undefined) profileData.bio = data.bio;
    if (data.headline !== undefined) profileData.headline = data.headline;
    if (data.location !== undefined) profileData.location = data.location;
    if (data.website !== undefined) profileData.website = data.website;
    if (data.skills !== undefined) profileData.skills = data.skills;
    if (data.experience !== undefined) profileData.experience = data.experience;
    if (data.education !== undefined) profileData.education = data.education;
    if (data.resumeUrl !== undefined) profileData.resumeUrl = data.resumeUrl;
    if (data.company !== undefined) profileData.company = data.company;
    if (data.currentRole !== undefined) profileData.currentRole = data.currentRole;

    if (Object.keys(profileData).length > 0) {
      await prisma.profile.update({
        where: { userId },
        data: profileData,
      });
      // Fire and forget — match alerts for PRO recruiters
      matchAlertService.checkNewMatches(userId).catch(() => {});
    }

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return {
      user: {
        id: updated!.id,
        email: updated!.email,
        name: updated!.name,
        avatar: updated!.avatar,
        role: updated!.role,
        emailVerified: updated!.emailVerified?.toISOString() ?? null,
        createdAt: updated!.createdAt.toISOString(),
        profile: updated!.profile
          ? {
              id: updated!.profile.id,
              bio: updated!.profile.bio,
              headline: updated!.profile.headline,
              location: updated!.profile.location,
              website: updated!.profile.website,
              skills: updated!.profile.skills,
              experience: updated!.profile
                .experience as Record<string, unknown>[],
              education: updated!.profile
                .education as Record<string, unknown>[],
              resumeUrl: updated!.profile.resumeUrl,
              company: updated!.profile.company,
              currentRole: updated!.profile.currentRole,
            }
          : null,
      },
    };
  },

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError(400, "INVALID_REQUEST", "Cannot follow yourself");
    }

    const target = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!target) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return { following: false };
    }

    await prisma.follow.create({ data: { followerId, followingId } });

    await notificationService.createNotification(
      followingId,
      "FOLLOW",
      "New Follower",
      "Someone started following you",
      `/users/${followerId}/profile`
    );

    return { following: true };
  },

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          follower: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: follows.map((f) => f.follower),
      meta: { total, page, limit },
    };
  },

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          following: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: follows.map((f) => f.following),
      meta: { total, page, limit },
    };
  },

  async searchUsers(query: string, role?: string) {
    const where: Record<string, unknown> = {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { profile: { skills: { has: query } } },
      ],
    };
    if (role && ["SEEKER", "RECRUITER"].includes(role)) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where: where as any,
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        email: true,
        profile: {
          select: {
            headline: true,
            skills: true,
            communityScore: true,
            location: true,
          },
        },
      },
      take: 20,
    });

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        email: u.email,
        headline: u.profile?.headline ?? null,
        skills: u.profile?.skills ?? [],
        communityScore: u.profile?.communityScore ?? 0,
        location: u.profile?.location ?? null,
      })),
    };
  },

  async getMutualConnections(userId: string, targetUserId: string) {
    // Get who the current user follows
    const myFollowing = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const myFollowingIds = new Set(myFollowing.map((f) => f.followingId));

    // Get who follows the target user
    const targetFollowers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        follower: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Find mutual: users who I follow AND who follow the target
    // (they can make an intro)
    const mutual: MutualConnection[] = targetFollowers
      .filter((f) => myFollowingIds.has(f.follower.id))
      .map((f) => ({
        id: f.follower.id,
        name: f.follower.name,
        avatar: f.follower.avatar,
        via: { id: "", name: "" }, // ponytail: simplified - shows mutual exist without naming the path
      }));

    // Also get users who follow both me and the target
    const myFollowers = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    const myFollowerIds = new Set(myFollowers.map((f) => f.followerId));

    const mutualFollowers = targetFollowers
      .filter(
        (f) =>
          myFollowerIds.has(f.follower.id) &&
          !myFollowingIds.has(f.follower.id)
      )
      .map((f) => ({
        id: f.follower.id,
        name: f.follower.name,
        avatar: f.follower.avatar,
        via: { id: "", name: "" },
      }));

    return { data: [...mutual, ...mutualFollowers].slice(0, 20) };
  },
};
