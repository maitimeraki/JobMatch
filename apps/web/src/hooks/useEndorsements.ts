import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endorsementApi } from "../lib/api";
import toast from "react-hot-toast";
import type { CreateEndorsementInput } from "@jobmatch/shared";

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: () => endorsementApi.getSkills(),
  });
}

export function useCreateEndorsement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEndorsementInput) => endorsementApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["endorsements"] });
      toast.success("Endorsement created");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to create endorsement");
    },
  });
}

export function useUserEndorsements(userId: string) {
  return useQuery({
    queryKey: ["endorsements", userId],
    queryFn: () => endorsementApi.getUserEndorsements(userId),
    enabled: !!userId,
  });
}
