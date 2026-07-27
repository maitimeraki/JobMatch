import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { referralApi } from "../lib/api";
import toast from "react-hot-toast";
import type { CreateReferralInput } from "@jobmatch/shared";

export function useSentReferrals() {
  return useQuery({
    queryKey: ["referrals", "sent"],
    queryFn: () => referralApi.getSent(),
  });
}

export function useReceivedReferrals() {
  return useQuery({
    queryKey: ["referrals", "received"],
    queryFn: () => referralApi.getReceived(),
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferralInput) => referralApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals"] });
      toast.success("Referral request sent");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to send referral");
    },
  });
}

export function useAcceptReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals"] });
      toast.success("Referral accepted");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to accept referral");
    },
  });
}

export function useDeclineReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralApi.decline(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals"] });
      toast.success("Referral declined");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to decline referral");
    },
  });
}
