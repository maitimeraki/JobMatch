import prisma from "../config/db.js";
import { AppError } from "../middleware/error.middleware.js";
import { notificationService } from "./notification.service.js";
import type {
  CreatePostInput,
  PostResponse,
  CommentResponse,
} from "@jobmatch/shared";

function formatPost(
  post: Record<string, unknown>,
  userId?: string
): PostResponse {
  const author = post.author as {
    id: string;
    name: string;
    avatar: string | null;
    recruiterPlan?: { verified: boolean } | null;
  };
  const isVerified = author.recruiterPlan?.verified ?? false;

  const count = post._count as { likes?: number; comments?: number } | undefined;
  const likesCount = count?.likes ?? 0;
  const commentsCount = count?.comments ?? 0;

  const likesArr = post.likes as { id: string }[] | undefined;
  const likedByMe = likesArr ? likesArr.length > 0 : false;

  const createdAt =
    post.createdAt instanceof Date
      ? post.createdAt.toISOString()
      : String(post.createdAt);

  return {
    id: post.id as string,
    authorId: post.authorId as string,
    author: { id: author.id, name: author.name, avatar: author.avatar, isVerified },
    content: post.content as string,
    category: (post.category as PostResponse["category"]) ?? "DISCUSSION",
    mediaUrl: (post.mediaUrl as string) ?? null,
    mediaType: (post.mediaType as PostResponse["mediaType"]) ?? null,
    likes: likesCount,
    comments: commentsCount,
    likedByMe,
    createdAt,
  };
}

function formatComment(comment: Record<string, unknown>): CommentResponse {
  const author = comment.author as {
    id: string;
    name: string;
    avatar: string | null;
  };
  const createdAt =
    comment.createdAt instanceof Date
      ? comment.createdAt.toISOString()
      : String(comment.createdAt);

  return {
    id: comment.id as string,
    postId: comment.postId as string,
    author,
    content: comment.content as string,
    createdAt,
  };
}

export const postService = {
  async createPost(authorId: string, data: CreatePostInput) {
    const post = await prisma.post.create({
      data: {
        authorId,
        content: data.content,
        category: data.category ?? "DISCUSSION",
        mediaUrl: data.mediaUrl ?? null,
        mediaType: data.mediaType ?? null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
      },
    });

    const formatted = formatPost(
      { ...post, _count: { likes: 0, comments: 0 }, likes: [] as { id: string }[] },
      authorId
    );

    return { post: formatted };
  },

  async getFeed(userId: string, cursor?: string, limit: number = 20, mode: string = "following", category?: string, authorId?: string) {
    const where: Record<string, unknown> = {};
    if (category && category !== "ALL") where.category = category;

    if (authorId) {
      where.authorId = authorId;
    } else if (mode === "following") {
      const followingIds = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followedIds = followingIds.map((f) => f.followingId);
      // Include followed users + high-community-score users
      const highScoreProfiles = await prisma.profile.findMany({
        where: { communityScore: { gte: 10 } },
        select: { userId: true },
      });
      const highScoreIds = highScoreProfiles.map((p) => p.userId);
      const visibleIds = [...new Set([...followedIds, ...highScoreIds])];
      if (visibleIds.length > 0) {
        where.authorId = { in: visibleIds };
      } else {
        // Fall back to global feed if not following anyone
        return this.getFeed(userId, cursor, limit, "discovery", category, authorId);
      }
    }

    const posts = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: where as any,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      data: items.map((p) => formatPost(p, userId)),
      meta: {
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
    };
  },

  async getPost(id: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
        _count: { select: { likes: true, comments: true } },
        ...(userId
          ? { likes: { where: { userId }, select: { id: true } } }
          : { likes: false }),
      },
    });

    if (!post) {
      throw new AppError(404, "NOT_FOUND", "Post not found");
    }

    return { post: formatPost(post, userId) };
  },

  async deletePost(id: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) {
      throw new AppError(404, "NOT_FOUND", "Post not found");
    }
    if (post.authorId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not your post");
    }
    await prisma.post.delete({ where: { id } });
  },

  async toggleLike(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new AppError(404, "NOT_FOUND", "Post not found");
    }

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await prisma.like.create({ data: { postId, userId } });

    if (post.authorId !== userId) {
      await notificationService.createNotification(
        post.authorId,
        "LIKE",
        "New Like",
        "Someone liked your post",
        `/posts/${postId}`
      );
    }

    return { liked: true };
  },

  async addComment(postId: string, authorId: string, content: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new AppError(404, "NOT_FOUND", "Post not found");
    }

    const comment = await prisma.comment.create({
      data: { postId, authorId, content },
      include: {
        author: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
      },
    });

    if (post.authorId !== authorId) {
      await notificationService.createNotification(
        post.authorId,
        "COMMENT",
        "New Comment",
        `${comment.author.name} commented on your post`,
        `/posts/${postId}`
      );
    }

    return { comment: formatComment(comment) };
  },

  async getComments(postId: string) {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, avatar: true, recruiterPlan: { select: { verified: true } } } },
      },
    });

    return { comments: comments.map(formatComment) };
  },
};
