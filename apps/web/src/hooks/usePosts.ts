import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "../lib/api";
import type { CreatePostInput } from "@jobmatch/shared";

export function useFeed(mode = "following", category?: string) {
  return useInfiniteQuery({
    queryKey: ["feed", mode, category],
    queryFn: ({ pageParam }) => postsApi.getFeed(pageParam as string | undefined, mode, category),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      const data = lastPage.data as any[];
      return data?.length === 20 ? data[data.length - 1]?.id : undefined;
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) =>
      postsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsApi.toggleLike(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postsApi.addComment(postId, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsApi.delete(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
}
