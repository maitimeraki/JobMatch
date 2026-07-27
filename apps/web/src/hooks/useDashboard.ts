import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.getStats(),
  });
}

export function useDashboardPipeline() {
  return useQuery({
    queryKey: ["dashboard", "pipeline"],
    queryFn: () => dashboardApi.getPipeline(),
  });
}

export function useTalentPool(jobId?: string) {
  return useQuery({
    queryKey: ["dashboard", "talent-pool", jobId],
    queryFn: () => dashboardApi.getTalentPool(jobId),
  });
}
