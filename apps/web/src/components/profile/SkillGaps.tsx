import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { usersApi } from "../../lib/api";

interface Recommendation {
  skill: string;
  demandLevel: "high" | "medium" | "low";
}

interface SkillGapData {
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  recommendations: Recommendation[];
}

interface SkillGapsProps {
  userId: string;
  jobId?: string;
  compact?: boolean;
}

const DEMAND_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

export function SkillGaps({ userId, jobId, compact }: SkillGapsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["skill-gaps", userId, jobId],
    queryFn: () => usersApi.getSkillGaps(userId, jobId),
    enabled: !!userId,
  });

  const result: SkillGapData | undefined = (data as any)?.data;
  if (isLoading || !result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Skill Gap Analysis
          <Badge variant={result.matchPercentage >= 70 ? "default" : result.matchPercentage >= 40 ? "secondary" : "outline"}>
            {result.matchPercentage}% match
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.matchedSkills.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-green-700">Matched Skills</p>
            <div className="flex flex-wrap gap-1">
              {result.matchedSkills.map((s) => <Badge key={s} variant="secondary" className="bg-green-50 text-green-700">{s}</Badge>)}
            </div>
          </div>
        )}
        {result.recommendations.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-amber-700">Skills to Grow</p>
            <div className="flex flex-wrap gap-1">
              {result.recommendations.map((r) => (
                <Badge key={r.skill} variant="outline" className={cn(DEMAND_COLORS[r.demandLevel])}>
                  {r.skill}
                  <span className="ml-1 text-[10px] uppercase">{r.demandLevel} demand</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        {!compact && result.missingSkills.length > 0 && (
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.open("https://www.google.com/search?q=" + encodeURIComponent(result.missingSkills.slice(0, 3).join(" ") + " course"), "_blank")}>
            Find courses for missing skills
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
