import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postsApi, usersApi } from "../lib/api";
import { PostCard } from "../components/feed/PostCard";
import { CommentSection } from "../components/feed/CommentSection";
import { PostSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { useToggleLike, useAddComment, useDeletePost } from "../hooks/usePosts";
import { useCreateEndorsement, useUserEndorsements, useSkills } from "../hooks/useEndorsements";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [endorsedSkills, setEndorsedSkills] = useState<Set<string>>(new Set());

  const { data: postData, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.getPost(id!),
    enabled: !!id,
  });

  const { data: commentsData } = useQuery({
    queryKey: ["post-comments", id],
    queryFn: () => postsApi.getComments(id!),
    enabled: !!id,
  });

  const toggleLike = useToggleLike();
  const addCommentMutation = useAddComment(id || "");
  const deletePost = useDeletePost();
  const createEndorsement = useCreateEndorsement();

  const post: any = (postData as any)?.data?.post;
  const comments: any[] = (commentsData as any)?.data?.comments ?? [];

  const { data: profileData } = useQuery({
    queryKey: ["profile-brief", post?.author?.id],
    queryFn: () => usersApi.getProfile(post!.author.id),
    enabled: !!post?.author?.id,
  });

  const authorSkills: string[] = (profileData as any)?.data?.user?.profile?.skills ?? [];

  const { data: skillsData } = useSkills();
  const skillsList: any[] = (skillsData as any)?.data ?? [];
  const skillNameToId = new Map(skillsList.map((s: any) => [s.name, s.id]));

  if (isLoading) return <div className="mx-auto max-w-2xl space-y-4 pt-6">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>;

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <EmptyState title="Post not found" description="This post may have been deleted." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="self-start">
        &larr; Back
      </Button>

      <PostCard
        post={post}
        onLike={() => toggleLike.mutate(post.id)}
        onComment={() => {}}
        onDelete={() => {
          deletePost.mutate(post.id, {
            onSuccess: () => navigate("/feed"),
          });
        }}
        isOwn={post.authorId === user?.id}
      />

      {user?.role === "RECRUITER" && post.authorId !== user?.id && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Interested in this candidate?</p>
          <Link
            to={`/profile/${post.author.id}`}
            className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View {post.author.name}'s Profile
          </Link>
        </div>
      )}

      {user && post.authorId !== user.id && authorSkills.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Endorse {post.author.name}'s Skills</h3>
          <div className="flex flex-wrap gap-2">
            {authorSkills.map((skill: string) => {
              const isEndorsed = endorsedSkills.has(skill);
              return (
                <button
                  key={skill}
                  disabled={isEndorsed || !skillNameToId.has(skill)}
                  onClick={() => {
                    const skillId = skillNameToId.get(skill);
                    if (!skillId) return;
                    createEndorsement.mutate(
                      { endorsedId: post.authorId, skillId, postId: post.id },
                      {
                        onSuccess: () => setEndorsedSkills((prev) => new Set(prev).add(skill)),
                      }
                    );
                  }}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    isEndorsed
                      ? "bg-muted text-muted-foreground cursor-default"
                      : "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                  )}
                >
                  {skill} {isEndorsed ? "✓" : "+ Endorse"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Comments ({post.comments})</h2>
        <CommentSection
          comments={comments}
          onAddComment={async (content: string) => {
            await addCommentMutation.mutateAsync(content);
          }}
        />
      </div>
    </div>
  );
}
