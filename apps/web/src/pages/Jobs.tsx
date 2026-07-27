import { useState } from "react";
import { useSearchJobs } from "../hooks/useJobs";
import { JobCard } from "../components/jobs/JobCard";
import { JobFilter } from "../components/jobs/JobFilter";
import { JobSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";

export default function Jobs() {
  const [filters, setFilters] = useState<any>({});
  const { data, isLoading } = useSearchJobs(filters);
  const jobs = (data as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Find jobs</h1>
      </div>
      <JobFilter filters={filters} onChange={setFilters} />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <JobSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Try adjusting your filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job: any) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
