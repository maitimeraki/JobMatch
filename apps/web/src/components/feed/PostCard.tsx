import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { cn, timeAgo } from "../../lib/utils";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import type { PostResponse, PostCategory } from "@jobmatch/shared";

const CATEGORY_COLORS: Record<PostCategory, string> = {
  PROJECT_SHOWCASE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  LEARNING: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  QUESTION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ACHIEVEMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DISCUSSION: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

const CATEGORY_LABELS: Record<PostCategory, string> = {
  PROJECT_SHOWCASE: "Project Showcase",
  LEARNING: "Learning",
  QUESTION: "Question",
  ACHIEVEMENT: "Achievement",
  DISCUSSION: "Discussion",
};

interface PostCardProps {
  post: PostResponse;
  onLike: () => void;
  onComment: () => void;
  onDelete?: () => void;
  isOwn?: boolean;
}

export function PostCard({ post, onLike, onComment, onDelete, isOwn }: PostCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar src={post.author.avatar} fallback={post.author.name} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1">
                <Link to={`/profile/${post.author.id}`} className="font-semibold hover:underline">{post.author.name}</Link>
                <VerifiedBadge isVerified={post.author.isVerified ?? false} />
              </span>
              <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/feed?category=${post.category}`}
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  CATEGORY_COLORS[post.category] || CATEGORY_COLORS.DISCUSSION
                )}
              >
                {CATEGORY_LABELS[post.category] || post.category}
              </Link>
              {isOwn && onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
          {post.mediaUrl && (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="mt-2 max-h-96 w-full rounded-lg object-cover"
            />
          )}
          <div className="flex items-center gap-4 pt-2">
            <Button variant="ghost" size="sm" className={cn("gap-1", post.likedByMe && "text-red-500")} onClick={onLike}>
              <Heart className={cn("h-4 w-4", post.likedByMe && "fill-current")} />
              {post.likes}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1" onClick={onComment}>
              <MessageCircle className="h-4 w-4" />
              {post.comments}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
