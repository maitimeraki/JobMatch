import { useQuery } from "@tanstack/react-query";
import { usersApi, jobsApi } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar } from "../components/ui/avatar";

export default function Admin() {
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersApi.search(""),
  });
  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => jobsApi.search({ page: 1, limit: 50 }),
  });

  const usersList = (users as any)?.data ?? [];
  const jobsList = (jobs as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{usersList.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Jobs</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{jobsList.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Jobs</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{jobsList.filter((j: any) => j.status === "ACTIVE").length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usersList.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatar} fallback={u.name} />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <Badge>{u.role}</Badge>
              </div>
            ))}
            {usersList.length === 0 && <p className="text-sm text-muted-foreground">No users found</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Job Listings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {jobsList.map((j: any) => (
              <div key={j.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted-foreground">{j.recruiter?.name} · {j.location}</p>
                </div>
                <Badge>{j.status}</Badge>
              </div>
            ))}
            {jobsList.length === 0 && <p className="text-sm text-muted-foreground">No jobs found</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
