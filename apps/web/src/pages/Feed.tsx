import { useState } from "react";
import { useFeed, useCreatePost, useToggleLike, useAddComment, useDeletePost } from "../hooks/usePosts";
import { PostCard } from "../components/feed/PostCard";
import { CreatePost } from "../components/feed/CreatePost";
import { CommentSection } from "../components/feed/CommentSection";
import { PostSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import { useAuthStore } from "../stores/authStore";
import { cn } from "../lib/utils";
import type { PostCategory } from "@jobmatch/shared";

const CATEGORY_TABS = [
  { key: "ALL", label: "All" },
  { key: "PROJECT_SHOWCASE", label: "Project Showcase" },
  { key: "LEARNING", label: "Learning" },
  { key: "QUESTION", label: "Question" },
  { key: "ACHIEVEMENT", label: "Achievement" },
  { key: "DISCUSSION", label: "Discussion" },
] as const;

export default function Feed() {
  const [feedMode, setFeedMode] = useState<"following" | "discovery">("following");
  const [category, setCategory] = useState("ALL");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(feedMode, category === "ALL" ? undefined : category);
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const addComment = useAddComment;
  const deletePost = useDeletePost();
  const { user } = useAuthStore();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const posts = data?.pages.flatMap((p: any) => p.data) ?? [];

  const handleCreatePost = async (content: string, cat: PostCategory, mediaUrl?: string, mediaType?: string) => {
    const mt = mediaType ? (mediaType as "IMAGE" | "VIDEO") : undefined;
    await createPost.mutateAsync({ content, category: cat, mediaUrl, mediaType: mt });
  };

  const handleToggleLike = (postId: string) => {
    toggleLike.mutate(postId);
  };

  const handleAddComment = (postId: string) => async (content: string) => {
    await addComment(postId).mutateAsync(content);
  };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <div className="flex rounded-lg border p-0.5">
          <button
            className={cn("rounded-md px-3 py-1 text-sm transition-colors", feedMode === "following" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            onClick={() => setFeedMode("following")}
          >
            Following
          </button>
          <button
            className={cn("rounded-md px-3 py-1 text-sm transition-colors", feedMode === "discovery" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            onClick={() => setFeedMode("discovery")}
          >
            Discovery
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
              category === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
            onClick={() => setCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CreatePost onSubmit={handleCreatePost} />
      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Be the first to share something!" />
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post.id}>
              <PostCard
                post={post}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                onDelete={() => deletePost.mutate(post.id)}
                isOwn={post.authorId === user?.id}
              />
              {expandedPost === post.id && <CommentSection comments={[]} onAddComment={handleAddComment(post.id)} />}
            </div>
          ))}
          {hasNextPage && (
            <button
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
