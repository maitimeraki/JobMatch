import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn, formatDate } from "../../lib/utils";

interface TimelineEntry {
  status: string;
  note: string | null;
  createdAt: string;
}

interface ApplicationTimelineProps {
  applicationId: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Applied",
  REVIEWING: "Under Review",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-blue-400 bg-blue-100 text-blue-700",
  REVIEWING: "border-amber-400 bg-amber-100 text-amber-700",
  SHORTLISTED: "border-purple-400 bg-purple-100 text-purple-700",
  REJECTED: "border-red-400 bg-red-100 text-red-700",
  HIRED: "border-green-400 bg-green-100 text-green-700",
};

export function ApplicationTimeline({ applicationId, onClose }: ApplicationTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["application-timeline", applicationId],
    queryFn: () => applicationsApi.getTimeline(applicationId),
    enabled: !!applicationId,
  });

  const timeline: TimelineEntry[] = (data as any)?.data?.timeline ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="mx-4 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-lg">Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading timeline...</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes yet.</p>
          ) : (
            <div className="relative space-y-0">
              {timeline.map((entry, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Vertical line */}
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[15px] top-6 h-full w-0.5 bg-muted" />
                  )}
                  {/* Dot */}
                  <div className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2", STATUS_COLORS[entry.status] || STATUS_COLORS.PENDING)}>
                    <div className="h-2 w-2 rounded-full bg-current" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                    {entry.note && <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={onClose}>Close</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
