import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shortlistApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/text-area";
import { EmptyState } from "../components/common/EmptyState";
import toast from "react-hot-toast";
import { Bookmark, Download, ChevronDown, ChevronUp, Users } from "lucide-react";

export default function Shortlist() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const plan = user?.role === "RECRUITER" ? (user as any)?.plan?.tier ?? "FREE" : "FREE";
  const isPro = plan === "PRO";

  const { data, isLoading } = useQuery({
    queryKey: ["shortlist"],
    queryFn: () => shortlistApi.list() as Promise<any>,
    enabled: user?.role === "RECRUITER",
  });
  const items: any[] = data?.data?.items ?? [];

  const toggleMut = useMutation({
    mutationFn: (candidateId: string) => shortlistApi.toggle(candidateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shortlist"] }),
  });

  const noteMut = useMutation({
    mutationFn: ({ candidateId, note }: { candidateId: string; note: string }) =>
      shortlistApi.updateNote(candidateId, note),
    onSuccess: () => {
      toast.success("Note saved");
      qc.invalidateQueries({ queryKey: ["shortlist"] });
    },
  });

  if (user?.role !== "RECRUITER") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Only recruiters can view the shortlist.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shortlisted Candidates ({items.length})</h1>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={async () => {
            if (!isPro) { toast("Upgrade to Pro to export CSV"); return; }
            try {
              const token = localStorage.getItem("accessToken");
              const res = await fetch("/api/v1/shortlist/export", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error("Export failed");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              const date = new Date().toISOString().split("T")[0];
              a.download = `shortlist-${date}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } catch { toast.error("Export failed"); }
          }}>
            <Download className="mr-1 h-4 w-4" />
            {isPro ? "Export CSV" : "Upgrade to Export"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState icon={<Bookmark className="h-8 w-8" />} title="No candidates saved" description="Save candidates from the talent pool or search results to review them later." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/profile/${item.candidateId}`}>
                    <Avatar src={item.candidate.avatar} fallback={item.candidate.name} className="h-10 w-10" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/profile/${item.candidateId}`} className="font-semibold hover:underline">
                          {item.candidate.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.candidate.headline ?? ""}</p>
                        {item.jobTitle && <p className="text-xs text-muted-foreground mt-0.5">Shortlisted for: {item.jobTitle}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Score: {item.candidate.communityScore}</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => toggleMut.mutate(item.candidateId)}>
                          ×
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.candidate.skills?.slice(0, 6).map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>

                    {/* Note section */}
                    <div className="mt-3 border-t pt-2">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        {expandedId === item.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {item.note ? `Note: ${item.note.slice(0, 80)}${item.note.length > 80 ? "..." : ""}` : (isPro ? "Add private note" : "🔒 Notes are Pro")}
                      </button>
                      {expandedId === item.id && (
                        <div className="mt-2 space-y-2">
                          {isPro ? (
                            <>
                              <Textarea
                                placeholder="Private note about this candidate (max 2000 chars)..."
                                value={noteInputs[item.candidateId] ?? item.note ?? ""}
                                onChange={(e) => setNoteInputs({ ...noteInputs, [item.candidateId]: e.target.value })}
                                maxLength={2000}
                                rows={3}
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">{(noteInputs[item.candidateId] ?? item.note ?? "").length}/2000</span>
                                <Button size="sm" onClick={() => noteMut.mutate({ candidateId: item.candidateId, note: noteInputs[item.candidateId] ?? "" })}>
                                  Save Note
                                </Button>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground"><Link to="/pricing" className="text-blue-500 hover:underline">Upgrade to Pro</Link> to add private notes.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
