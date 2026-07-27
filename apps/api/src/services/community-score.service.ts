import prisma from "../config/db.js";

export const communityScoreService = {
  async recalculateScore(userId: string): Promise<number> {
    const [endorsementsCount, totalLikes, userPosts] = await Promise.all([
      // Endorsements received by this user
      prisma.endorsement.count({ where: { endorsedId: userId } }),

      // Likes received across all posts by this user
      prisma.like.count({ where: { post: { authorId: userId } } }),

      // Posts authored by this user with their comments
      prisma.post.findMany({
        where: { authorId: userId },
        include: { comments: { select: { content: true } } },
      }),
    ]);

    // Count of user's posts that have at least one comment with content longer than 50 characters
    const postsWithMeaningfulComments = userPosts.filter((p) =>
      p.comments.some((c) => c.content.length > 50)
    ).length;

    // Score formula: (endorsements x 3) + (posts with meaningful comments x 2) + (likes x 0.5)
    const score = Math.round(
      endorsementsCount * 3 + postsWithMeaningfulComments * 2 + totalLikes * 0.5
    );

    // Persist to profile
    await prisma.profile.update({
      where: { userId },
      data: { communityScore: score },
    });

    return score;
  },
};
