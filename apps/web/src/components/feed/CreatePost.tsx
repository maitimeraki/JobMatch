import { useState, useRef } from "react";
import { Image, Send, X } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/text-area";
import { Avatar } from "../ui/avatar";
import { useAuthStore } from "../../stores/authStore";
import { uploadApi } from "../../lib/api";
import type { PostCategory } from "@jobmatch/shared";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "PROJECT_SHOWCASE", label: "Project Showcase" },
  { value: "LEARNING", label: "Learning" },
  { value: "QUESTION", label: "Question" },
  { value: "ACHIEVEMENT", label: "Achievement" },
  { value: "DISCUSSION", label: "Discussion" },
];

interface CreatePostProps {
  onSubmit: (content: string, category: PostCategory, mediaUrl?: string, mediaType?: string) => Promise<void>;
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("DISCUSSION");
  const [submitting, setSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;
      if (mediaFile) {
        setUploading(true);
        const res = await uploadApi.uploadFile(mediaFile);
        const uploadData = (res as any)?.data;
        mediaUrl = uploadData?.url;
        mediaType = uploadData?.mediaType;
        setUploading(false);
      }
      await onSubmit(content, category, mediaUrl, mediaType);
      setContent("");
      setCategory("DISCUSSION");
      clearMedia();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <input type="file" ref={fileRef} accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
      <div className="flex gap-3">
        <Avatar src={user?.avatar} fallback={user?.name || "U"} />
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          {mediaPreview && (
            <div className="relative inline-block">
              {mediaFile?.type.startsWith("video/") ? (
                <video src={mediaPreview} className="max-h-48 rounded-lg" controls />
              ) : (
                <img src={mediaPreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
              )}
              <button onClick={clearMedia} className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={submitting}>
                <Image className="mr-1 h-4 w-4" />
                {mediaFile ? "Change Media" : "Media"}
              </Button>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostCategory)}
                className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || submitting}>
              <Send className="mr-1 h-4 w-4" />
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
