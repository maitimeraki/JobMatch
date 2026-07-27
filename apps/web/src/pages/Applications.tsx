import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, Calendar, Eye, BarChart3, TrendingUp, Users } from "lucide-react";
import { applicationsApi, insightsApi } from "../lib/api";
import { ApplicationTimeline } from "../components/applications/ApplicationTimeline";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { JobSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import { formatDate } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  REVIEWING: "bg-blue-100 text-blue-800 border-blue-200",
  SHORTLISTED: "bg-purple-100 text-purple-800 border-purple-200",
  HIRED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

export default function Applications() {
  const user = useAuthStore((s) => s.user);
  const [insights, setInsights] = useState<Record<string, any>>({});
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null);
  const [timelineAppId, setTimelineAppId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.getMyApplications(),
  });
  const applications = (data as any)?.data?.applications ?? [];

  const handleInsight = async (appId: string) => {
    if (insights[appId]) return;
    setLoadingInsight(appId);
    try {
      const res: any = await insightsApi.getApplicationInsights(appId);
      setInsights((prev) => ({ ...prev, [appId]: res.data }));
    } catch {
      setInsights((prev) => ({ ...prev, [appId]: { error: true } }));
    } finally {
      setLoadingInsight(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <JobSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No applications yet"
          description="Apply to jobs to track them here."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Applications</h1>
        {user?.role === "SEEKER" && (
          <Link to="/pricing">
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-1 h-4 w-4" />
              Get Premium Insights ($5/mo)
            </Button>
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {applications.map((app: any) => {
          const insight = insights[app.id];
          return (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="font-semibold hover:text-primary"
                    >
                      {app.job?.title || "Untitled Position"}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {app.job?.company || "Unknown Company"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Applied {formatDate(app.createdAt)}
                      </span>
                      {app.source === "REFERRAL" && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                          Referral
                        </span>
                      )}
                    </div>

                    {insight && !insight.error && (
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{insight.totalApplicants} applicants</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span>Rank #{insight.yourRank}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span>{insight.skillMatchPercentage}% skill match</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span>{insight.recruiterViews} profile views</span>
                        </div>
                        {insight.averageResponseDays != null && (
                          <div className="col-span-2 text-center text-muted-foreground">
                            Avg response: ~{insight.averageResponseDays} days
                          </div>
                        )}
                      </div>
                    )}
                    {insight?.error && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Premium required for insights.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={STATUS_COLORS[app.status] || ""}>
                      {app.status}
                    </Badge>
                    {user?.role === "SEEKER" && !insight && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        disabled={loadingInsight === app.id}
                        onClick={() => handleInsight(app.id)}
                      >
                        {loadingInsight === app.id ? "Loading..." : "View Insights"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setTimelineAppId(app.id)}>
                      View Timeline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {timelineAppId && (
        <ApplicationTimeline applicationId={timelineAppId} onClose={() => setTimelineAppId(null)} />
      )}
    </div>
  );
}
