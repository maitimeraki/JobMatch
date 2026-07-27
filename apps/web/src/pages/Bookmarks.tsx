import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { jobsApi } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/common/EmptyState";
import { JobSkeleton } from "../components/common/LoadingSkeleton";
import { BookmarkCheck, Bookmark } from "lucide-react";

export default function Bookmarks() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => jobsApi.getBookmarks(),
  });
  const bookmarks: any[] = (data as any)?.data ?? [];

  const removeBookmark = useMutation({
    mutationFn: (jobId: string) => jobsApi.toggleBookmark(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Saved Jobs</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <JobSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Saved Jobs</h1>
        <EmptyState
          icon={<Bookmark className="h-12 w-12" />}
          title="No saved jobs"
          description="Bookmark jobs while browsing to save them here for later."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Jobs ({bookmarks.length})</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {bookmarks.map((job: any) => (
          <Card key={job.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <Link to={`/jobs/${job.id}`} className="flex-1">
                  <h3 className="font-semibold hover:text-primary">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.recruiter?.name || job.company}</p>
                  <p className="text-xs text-muted-foreground">{job.location} · {job.type?.replace("_", " ")}</p>
                  {job.skills && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                </Link>
                <Button variant="ghost" size="icon" onClick={() => removeBookmark.mutate(job.id)} title="Remove bookmark">
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
