import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ProfileSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import { Building2, Globe, MapPin, Users, Briefcase, ExternalLink } from "lucide-react";

export default function Company() {
  const { recruiterId } = useParams<{ recruiterId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["company", recruiterId],
    queryFn: () => api.get(`/company/${recruiterId!}`),
    enabled: !!recruiterId,
  });
  const company = (data as any)?.data;

  if (isLoading) return <ProfileSkeleton />;
  if (!company) return <div className="mx-auto max-w-3xl pt-12 text-center text-muted-foreground">Company not found</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-6">
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          {company.logo ? (
            <img src={company.logo} alt={company.companyName} className="mb-4 h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <h1 className="text-2xl font-bold">{company.companyName}</h1>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {company.industry && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{company.industry}</span>}
            {company.size && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{company.size} employees</span>}
            {company.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.location}</span>}
          </div>
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Globe className="h-3 w-3" />{company.website}
            </a>
          )}
        </CardContent>
      </Card>

      {company.description && (
        <Card>
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{company.description}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Open Jobs ({company.jobs?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {!company.jobs || company.jobs.length === 0 ? (
            <EmptyState icon={<Briefcase className="h-8 w-8" />} title="No open positions" description="Check back later for new opportunities." />
          ) : (
            <div className="space-y-3">
              {company.jobs.map((job: any) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="block rounded-lg border p-4 transition-colors hover:bg-accent">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{job.location}</span>
                        <span>{job.type?.replace("_", " ")}</span>
                        <Badge variant="outline" className="text-xs">{job.level}</Badge>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {job.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skills.map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
