import { Link, useNavigate } from "react-router-dom";
import { Bookmark, MapPin, Clock, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn, formatSalary, timeAgo } from "../../lib/utils";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import type { JobResponse } from "@jobmatch/shared";

interface JobCardProps {
  job: JobResponse;
  onBookmark?: () => void;
}

function MatchScoreBadge({ score }: { score: number }) {
  const colorClass =
    score > 60
      ? "bg-green-100 text-green-800 border-green-200"
      : score > 30
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <Badge variant="outline" className={cn("text-xs font-semibold", colorClass)}>
      {score}% match
    </Badge>
  );
}

export function JobCard({ job, onBookmark }: JobCardProps) {
  const navigate = useNavigate();
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold leading-tight">{job.title}</h3>
                {job.isFeatured && <span title="Featured"><Sparkles className="h-4 w-4 text-amber-500" /></span>}
                {job.isUrgent && <span title="Urgent Hire"><TrendingUp className="h-4 w-4 text-red-500" /></span>}
                {job.matchScore != null && <MatchScoreBadge score={job.matchScore} />}
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Link to={`/company/${job.recruiterId}`} className="hover:underline">{job.recruiter.name}</Link>
                <VerifiedBadge isVerified={job.recruiter.isVerified ?? false} />
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(job.createdAt)}
                </span>
              </div>
              <p className="text-sm font-medium text-primary">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                <Badge variant="secondary" className="text-xs">{job.type.replace("_", " ")}</Badge>
                <Badge variant="outline" className="text-xs">{job.level}</Badge>
                {job.skills.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {job.skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">+{job.skills.length - 3}</Badge>
                )}
              </div>
            </div>
            {onBookmark && (
              <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); onBookmark(); }}>
                <Bookmark className={cn("h-4 w-4", job.bookmarked && "fill-primary text-primary")} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
