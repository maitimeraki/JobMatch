import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { EmptyState } from "../common/EmptyState";
import { Users, BarChart3, TrendingUp, Target } from "lucide-react";

interface AnalysticsData {
  totalApplicants: number;
  experienceDistribution: { level: string; count: number; percentage: number }[];
  skillsCoverage: { skill: string; matchCount: number; total: number; percentage: number }[];
  applicantFlow: { date: string; count: number }[];
  avgSkillMatch: number;
}

const levelColors: Record<string, string> = {
  JUNIOR: "bg-gray-400",
  MID: "bg-blue-500",
  SENIOR: "bg-green-500",
  LEAD: "bg-purple-500",
};

export function JobAnalytics({ data }: { data: AnalysticsData | undefined }) {
  if (!data || data.totalApplicants === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-6"><EmptyState icon={<Users className="h-6 w-6" />} title="No applicants yet" description="Analytics appear once candidates apply." /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Card 1: Experience Distribution */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Applicants by Experience
          </div>
          {data.experienceDistribution.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {data.experienceDistribution.map((d) => (
                  <div
                    key={d.level}
                    className={`${levelColors[d.level] ?? "bg-gray-400"} h-full transition-all`}
                    style={{ width: `${d.percentage}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {data.experienceDistribution.map((d) => (
                  <span key={d.level} className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${levelColors[d.level] ?? "bg-gray-400"}`} />
                    {d.level}: {d.count} ({d.percentage}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Skill Coverage */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-green-500" />
            Skill Coverage
          </div>
          {data.skillsCoverage.length === 0 ? (
            <p className="text-xs text-muted-foreground">No skills listed for this job</p>
          ) : (
            <div className="space-y-2">
              {data.skillsCoverage.slice(0, 8).map((s) => (
                <div key={s.skill} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{s.skill}</span>
                    <span className="text-muted-foreground">{s.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Applicant Flow */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Applicant Flow (30d)
          </div>
          {data.applicantFlow.length === 0 ? (
            <p className="text-xs text-muted-foreground">No application activity</p>
          ) : (
            <div className="h-16">
              <svg viewBox="0 0 300 60" className="h-full w-full overflow-visible">
                {(() => {
                  const maxCount = Math.max(...data.applicantFlow.map((p) => p.count), 1);
                  const points = data.applicantFlow.map((d, i) => ({
                    x: (i / Math.max(data.applicantFlow.length - 1, 1)) * 290 + 5,
                    y: 55 - (d.count / maxCount) * 45,
                  }));
                  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                  return (
                    <>
                      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" />
                      {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#6366f1" stroke="#fff" strokeWidth="1" />
                      ))}
                    </>
                  );
                })()}
              </svg>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{data.applicantFlow[0]?.date?.slice(5) ?? ""}</span>
                <span>{data.applicantFlow[data.applicantFlow.length - 1]?.date?.slice(5) ?? ""}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 4: Average Match */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-amber-500" />
            Average Skill Match
          </div>
          <p className="text-3xl font-bold">{data.avgSkillMatch}%</p>
          <p className="text-xs text-muted-foreground">Average skill match across all applicants</p>
        </CardContent>
      </Card>
    </div>
  );
}
