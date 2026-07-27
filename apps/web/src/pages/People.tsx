import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../lib/api";
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { PostSkeleton } from "../components/common/LoadingSkeleton";
import { EmptyState } from "../components/common/EmptyState";
import { useAuthStore } from "../stores/authStore";
import { shortlistApi } from "../lib/api";
import { Search, Users, Bookmark } from "lucide-react";
import toast from "react-hot-toast";

export default function People() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["people", searchQuery, role],
    queryFn: () => usersApi.search(searchQuery, role || undefined) as Promise<any>,
    enabled: searchQuery.length > 0,
  });

  const followMut = useMutation({
    mutationFn: (id: string) => usersApi.follow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });

  const shortlistMut = useMutation({
    mutationFn: (candidateId: string) => shortlistApi.toggle(candidateId),
    onSuccess: (res: any) => {
      toast.success(res?.data?.saved ? "Saved to shortlist" : "Removed from shortlist");
    },
  });

  const people: any[] = data?.data ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="SEEKER">Job Seekers</option>
          <option value="RECRUITER">Recruiters</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      {searchQuery === "" ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Find people"
          description="Search by name or skill to discover professionals."
        />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
        </div>
      ) : people.length === 0 ? (
        <EmptyState title="No results" description="Try a different search term." />
      ) : (
        <div className="space-y-3">
          {people.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Link to={`/profile/${p.id}`}>
                  <Avatar src={p.avatar} fallback={p.name} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${p.id}`} className="font-semibold hover:underline">
                    {p.name}
                  </Link>
                  {p.headline && <p className="text-sm text-muted-foreground truncate">{p.headline}</p>}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.skills?.slice(0, 4).map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {(p.skills?.length ?? 0) > 4 && (
                      <span className="text-xs text-muted-foreground">+{p.skills.length - 4} more</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {p.location && <span>{p.location}</span>}
                    <span>Score: {p.communityScore}</span>
                    <Badge variant="outline" className="text-xs">{p.role}</Badge>
                  </div>
                </div>
                {p.id !== user?.id && (
                  <div className="flex items-center gap-1">
                    {user?.role === "RECRUITER" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Save to shortlist" onClick={() => shortlistMut.mutate(p.id)}>
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => followMut.mutate(p.id)}
                      disabled={followMut.isPending}
                    >
                      Follow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
