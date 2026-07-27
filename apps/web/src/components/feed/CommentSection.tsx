import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { timeAgo } from "../../lib/utils";
import type { CommentResponse } from "@jobmatch/shared";

interface CommentSectionProps {
  comments: CommentResponse[];
  onAddComment: (content: string) => Promise<void>;
}

export function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(content);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar src={c.author.avatar} fallback={c.author.name} className="h-8 w-8" />
          <div className="flex-1 rounded-lg bg-muted p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.author.name}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button size="icon" onClick={handleSubmit} disabled={!content.trim() || submitting}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
