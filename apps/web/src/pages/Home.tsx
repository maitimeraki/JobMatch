import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, Users, Zap, ArrowRight, BookmarkCheck, SendHorizonal, UserCheck, Clock, Sparkles, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../stores/authStore";
import { useSearchJobs } from "../hooks/useJobs";
import { applicationsApi, jobsApi, dashboardApi } from "../lib/api";
import { formatDate } from "../lib/utils";

function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      <section className="flex flex-col items-center text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Where professionals connect
          <span className="text-primary"> and opportunities find you</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Discover curated jobs, grow your professional presence, and connect
          with recruiters in one place.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to="/register" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link to="/jobs" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
            Browse Jobs
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Zap className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Smart Matching</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Personalized opportunities based on your skills, goals, and
              interests.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Users className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Community Growth</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Follow peers, exchange insights, and stay visible to
              opportunities.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Briefcase className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Easy Apply</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              One-click applications with resume upload and tracking.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SeekerDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: jobsData } = useSearchJobs({ page: 1, limit: 50 });
  const allJobs: any[] = (jobsData as any)?.data ?? [];

  const { data: appsData } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.getMyApplications(),
  });
  const applications: any[] = (appsData as any)?.data?.applications ?? [];

  const { data: bookmarksData } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => jobsApi.getBookmarks(),
  });
  const bookmarks: any[] = (bookmarksData as any)?.data ?? [];

  const userSkills: string[] = (user as any)?.profile?.skills ?? [];
  const recommendedJobs = allJobs.filter((j) =>
    j.skills?.some((s: string) => userSkills.includes(s))
  );

  const recentApps = applications.slice(0, 5);

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
    REVIEWING: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    SHORTLISTED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    HIRED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Here&apos;s your career overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allJobs.length}</p>
              <p className="text-sm text-muted-foreground">Jobs Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <SendHorizonal className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{applications.length}</p>
              <p className="text-sm text-muted-foreground">Applied</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <BookmarkCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bookmarks.length}</p>
              <p className="text-sm text-muted-foreground">Saved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recommended For You</h2>
          <Link to="/jobs" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recommendedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Add skills to your profile to get job recommendations</p>
              <Link to={`/profile/${user?.id}`}>
                <Button variant="outline" size="sm" className="mt-3">Update Profile</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedJobs.slice(0, 6).map((job: any) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.recruiter?.name || job.company}</p>
                    <p className="text-xs text-muted-foreground">{job.location}</p>
                    {job.skills && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {job.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{job.skills.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Recent Applications</h2>
          <Link to="/applications" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recentApps.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No applications yet</p>
              <Link to="/jobs">
                <Button variant="outline" size="sm" className="mt-3">Browse Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y">
              {recentApps.map((app: any) => (
                <Link key={app.id} to={`/jobs/${app.jobId}`} className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-4 px-4 transition-colors">
                  <div>
                    <p className="font-medium">{app.job?.title || "Untitled Position"}</p>
                    <p className="text-sm text-muted-foreground">{app.job?.company || "Unknown"} · {formatDate(app.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[app.status] || ""}>
                    {app.status}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function RecruiterHome() {
  const user = useAuthStore((s) => s.user);

  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
  });
  const stats = (statsData as any)?.data;

  const { data: jobsData } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => jobsApi.search({ page: 1, limit: 10 }),
  });
  const recentJobs: any[] = ((jobsData as any)?.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">Recruiter Dashboard overview</p>
        </div>
        <Link to="/dashboard">
          <Button variant="default">
            <Briefcase className="mr-2 h-4 w-4" />
            Full Dashboard
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeJobs ?? 0}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalApplications ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.referralHires ?? 0}</p>
              <p className="text-sm text-muted-foreground">Referral Hires</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-500/10 p-3">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.avgTimeToHire ?? 0}<span className="text-sm font-normal text-muted-foreground">d</span></p>
              <p className="text-sm text-muted-foreground">Avg Time-to-Hire</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/dashboard"><Button variant="default" size="sm"><Plus className="mr-1 h-4 w-4" />Post a Job</Button></Link>
          <Link to="/shortlist"><Button variant="outline" size="sm"><Users className="mr-1 h-4 w-4" />View Shortlist</Button></Link>
          <Link to="/jobs"><Button variant="outline" size="sm"><Briefcase className="mr-1 h-4 w-4" />Manage Jobs</Button></Link>
          <Link to="/pricing"><Button variant="outline" size="sm"><Sparkles className="mr-1 h-4 w-4" />Pricing & Plans</Button></Link>
        </CardContent>
      </Card>

      {/* Recent Job Listings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Recent Jobs</h2>
          <Link to="/dashboard" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {recentJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No jobs posted yet</p>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="mt-3">Post Your First Job</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentJobs.map((job: any) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.location} · {job.type?.replace("_", " ")}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{job.applicationsCount ?? 0} applicants</span>
                      <Badge variant="outline" className="text-[10px]">{job.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user?.role === "SEEKER") {
    return <SeekerDashboard />;
  }

  if (isAuthenticated && user?.role === "RECRUITER") {
    return <RecruiterHome />;
  }

  return <LandingPage />;
}
