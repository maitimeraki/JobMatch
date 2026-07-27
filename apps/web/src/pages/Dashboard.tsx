import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { jobsApi, dashboardApi, applicationsApi } from "../lib/api";
import { useCreateJob, useDeleteJob } from "../hooks/useJobs";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/text-area";
import { Badge } from "../components/ui/badge";
import { Avatar } from "../components/ui/avatar";
import { EmptyState } from "../components/common/EmptyState";
import { JobSkeleton } from "../components/common/LoadingSkeleton";
import { useAuthStore } from "../stores/authStore";
import { Briefcase, Users, Clock, UserCheck, ArrowRight, ArrowLeft, UserPlus, Send, Heart, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const PIPELINE_COLUMNS = ["PENDING", "REVIEWING", "SHORTLISTED", "HIRED", "REJECTED"];
const LEVELS = ["", "JUNIOR", "MID", "SENIOR", "LEAD"];

const columnLabels: Record<string, string> = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  SHORTLISTED: "Shortlisted",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const columnColors: Record<string, string> = {
  PENDING: "border-t-yellow-500",
  REVIEWING: "border-t-blue-500",
  SHORTLISTED: "border-t-purple-500",
  HIRED: "border-t-green-500",
  REJECTED: "border-t-red-500",
};

const levelBadgeColors: Record<string, string> = {
  JUNIOR: "bg-gray-100 text-gray-700 border-gray-200",
  MID: "bg-blue-100 text-blue-700 border-blue-200",
  SENIOR: "bg-green-100 text-green-700 border-green-200",
  LEAD: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "RECRUITER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Access denied. Recruiter dashboard is only available to recruiters.</p>
      </div>
    );
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const [showForm, setShowForm] = useState(false);
  const [levelFilter, setLevelFilter] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", location: "", type: "FULL_TIME", level: "MID",
    salaryMin: "", salaryMax: "", skills: "",
  });
  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => jobsApi.search({ page: 1, limit: 50 }),
  });
  const jobs = (jobsData as any)?.data ?? [];

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
  });
  const stats = (statsData as any)?.data;

  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ["dashboard-pipeline"],
    queryFn: () => dashboardApi.getPipeline(),
  });
  const pipeline = ((pipelineData as any)?.data ?? []).reduce((acc: any, g: any) => ({ ...acc, [g.status]: g.applications }), {});

  const { data: talentData, isLoading: talentLoading } = useQuery({
    queryKey: ["dashboard-talent"],
    queryFn: () => dashboardApi.getTalentPool(),
  });
  const talentPool = (talentData as any)?.data?.candidates ?? [];

  const { data: engagedData, isLoading: engagedLoading } = useQuery({
    queryKey: ["dashboard-most-engaged"],
    queryFn: () => dashboardApi.getMostEngaged(),
  });
  const mostEngaged = (engagedData as any)?.data?.data ?? [];

  const { data: matchAlertsData } = useQuery({
    queryKey: ["dashboard-match-alerts"],
    queryFn: () => dashboardApi.getMatchAlerts(),
  });
  const matchAlerts: any[] = (matchAlertsData as any)?.data ?? [];

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
    await createJob.mutateAsync({
      ...form,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      skills,
    });
    toast.success("Job posted!");
    setShowForm(false);
    setForm({ title: "", description: "", location: "", type: "FULL_TIME", level: "MID", salaryMin: "", salaryMax: "", skills: "" });
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await applicationsApi.updateStatus(appId, newStatus);
      toast.success(`Moved to ${columnLabels[newStatus] || newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const getNextStatus = (status: string): string | null => {
    const idx = PIPELINE_COLUMNS.indexOf(status);
    if (idx === -1 || idx >= PIPELINE_COLUMNS.length - 2) return null;
    return PIPELINE_COLUMNS[idx + 1];
  };

  const getPrevStatus = (status: string): string | null => {
    const idx = PIPELINE_COLUMNS.indexOf(status);
    if (idx <= 1) return null;
    return PIPELINE_COLUMNS[idx - 1];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Post a Job"}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.activeJobs ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.totalApplications ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Time-to-Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.avgTimeToHire ?? 0}<span className="text-sm font-normal text-muted-foreground"> days</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Referral Hires</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.referralHires ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Post a New Job</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <Input placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              <div className="flex gap-2">
                <select className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm flex-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="FREELANCE">Freelance</option>
                </select>
                <select className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm flex-1" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  <option value="JUNIOR">Junior</option><option value="MID">Mid</option>
                  <option value="SENIOR">Senior</option><option value="LEAD">Lead</option><option value="EXECUTIVE">Executive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Min salary" type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
                <Input placeholder="Max salary" type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
              </div>
              <Input placeholder="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <Button type="submit" disabled={createJob.isPending}>
                {createJob.isPending ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Match Alerts Section */}
      {matchAlerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Matching Candidates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{matchAlerts.reduce((sum: number, g: any) => sum + g.seekers.length, 0)} candidates matched your jobs this week</p>
            <div className="space-y-2">
              {matchAlerts.map((group: any) => (
                <div key={group.jobTitle} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{group.jobTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.seekers.map((s: any) => (
                      <Link key={s.name} to={s.link} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pipeline</h2>
          <select className="rounded-md border border-input bg-background px-3 py-1 text-sm" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            <option value="JUNIOR">Junior</option>
            <option value="MID">Mid</option>
            <option value="SENIOR">Senior</option>
            <option value="LEAD">Lead</option>
          </select>
        </div>
        {pipelineLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 w-64 shrink-0 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {PIPELINE_COLUMNS.map((status) => {
              const allItems = pipeline[status] ?? [];
              const items = levelFilter ? allItems.filter((a: any) => a.estimatedLevel === levelFilter) : allItems;
              return (
                <div key={status} className={`w-64 shrink-0 rounded-lg border-t-4 bg-card ${columnColors[status]}`}>
                  <div className="flex items-center justify-between border-b p-3">
                    <h3 className="text-sm font-semibold">{columnLabels[status]}</h3>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto p-2">
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">No candidates</p>
                    ) : (
                      items.map((app: any) => (
                        <Card key={app.id} className="border shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{app.applicant?.name || "Unknown"}</p>
                              {app.estimatedLevel && (
                                <Badge className={`text-[10px] ${levelBadgeColors[app.estimatedLevel] ?? "border"}`} variant="outline">{app.estimatedLevel}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{app.jobTitle}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{new Date(app.appliedDate).toLocaleDateString()}</p>
                            <div className="mt-2 flex items-center gap-1">
                              {getPrevStatus(status) && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" title={`Move to ${columnLabels[getPrevStatus(status)!]}`}
                                  onClick={() => handleStatusChange(app.id, getPrevStatus(status)!)}>
                                  <ArrowLeft className="h-3 w-3" />
                                </Button>
                              )}
                              {getNextStatus(status) && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" title={`Move to ${columnLabels[getNextStatus(status)!]}`}
                                  onClick={() => handleStatusChange(app.id, getNextStatus(status)!)}>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Talent Pool Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Talent Pool</h2>
        {talentLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : talentPool.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState title="No suggested candidates" description="Post more jobs to get AI-matched talent suggestions." />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {talentPool.map((candidate: any) => (
              <Card key={candidate.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={candidate.avatar} fallback={candidate.name || "?"} className="h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{candidate.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{candidate.headline || ""}</p>
                    </div>
                  </div>
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 4).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                      {candidate.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{candidate.skills.length - 4}</Badge>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {candidate.matchScore != null && (
                      <span className="flex items-center gap-1">
                        <UserPlus className="h-3 w-3" />
                        Match: {candidate.matchScore}%
                      </span>
                    )}
                    {candidate.communityScore != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Community: {candidate.communityScore}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => toast("Contact feature coming soon")}
                  >
                    <Send className="mr-1 h-3 w-3" />
                    Reach Out
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Most Engaged Candidates */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Most Engaged Candidates</h2>
        {engagedLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : mostEngaged.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState title="No engaged candidates yet" description="As seekers post and engage, top candidates will appear here." />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mostEngaged.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={c.avatar} fallback={c.name || "?"} className="h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.headline || ""}</p>
                    </div>
                  </div>
                  {c.skills && c.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{c.totalLikes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{c.totalComments}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.followersCount}</span>
                    <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" />Score: {c.communityScore}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => window.open("/profile/" + c.id, "_blank")}>
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Job Listings Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Job Listings</h2>
        {jobsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 3 }).map((_, i) => <JobSkeleton key={i} />)}</div>
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs posted" description="Post your first job listing!" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job: any) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.location}</p>
                      <Badge className="mt-1">{job.status}</Badge>
                      <p className="mt-2 text-sm">Applications: {job.applicationsCount || 0}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => deleteJob.mutate(job.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
