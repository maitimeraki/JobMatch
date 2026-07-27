import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useJob, useToggleBookmark, useApplyForJob, useJobApplications, useUpdateApplicationStatus } from "../hooks/useJobs";
import { useCreateReferral } from "../hooks/useReferrals";
import { usersApi, jobsApi, shortlistApi } from "../lib/api";
import { JobAnalytics } from "../components/jobs/JobAnalytics";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/text-area";
import { Avatar } from "../components/ui/avatar";
import { ApplicationForm } from "../components/jobs/ApplicationForm";
import { ProfileSkeleton } from "../components/common/LoadingSkeleton";
import { cn, formatSalary, timeAgo } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { UserCheck, Send, Sparkles, TrendingUp, Zap, DollarSign } from "lucide-react";
import { boostApi } from "../lib/api";
import { VerifiedBadge } from "../components/ui/VerifiedBadge";
import { SkillGaps } from "../components/profile/SkillGaps";
import toast from "react-hot-toast";
import type { MutualConnection } from "@jobmatch/shared";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error: jobError } = useJob(id!);
  const toggleBookmark = useToggleBookmark();
  const apply = useApplyForJob(id!);
  const { data: applicationsData } = useJobApplications(id!);
  const updateStatus = useUpdateApplicationStatus();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [referralModal, setReferralModal] = useState<MutualConnection | null>(null);
  const [referralMessage, setReferralMessage] = useState("");
  const createReferral = useCreateReferral();

  const job = (data as any)?.data?.job;
  const applications = (applicationsData as any)?.data?.applications ?? [];
  const isRecruiter = user?.role === "RECRUITER";
  const isOwner = isRecruiter && job?.recruiterId === user?.id;

  const userSkills: string[] = (user as any)?.profile?.skills ?? [];
  const matchedSkills = job?.skills?.filter((s: string) => userSkills.includes(s)) ?? [];
  const matchScore = job?.matchScore ?? (job?.skills?.length ? Math.round((matchedSkills.length / job.skills.length) * 100) : 0);

  const [boostLoading, setBoostLoading] = useState(false);
  const [bonusInput, setBonusInput] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTalentPool, setShowTalentPool] = useState(false);

  const { data: analyticsData } = useQuery({
    queryKey: ["job-analytics", id],
    queryFn: () => jobsApi.getAnalytics(id!),
    enabled: isOwner && showAnalytics,
  });
  const analytics = (analyticsData as any)?.data;

  const { data: talentPoolData, isLoading: talentLoading } = useQuery({
    queryKey: ["job-talent-pool", id],
    queryFn: () => jobsApi.getTalentPool(id!),
    enabled: isOwner && showTalentPool,
  });
  const talentPool = (talentPoolData as any)?.data?.candidates ?? [];

  const handlePurchaseBoost = async (type: "FEATURED" | "URGENT") => {
    setBoostLoading(true);
    try {
      await boostApi.purchaseBoost(id!, type);
      toast.success(type === "FEATURED" ? "Featured! Top of search for 7 days." : "Urgent! Notified to matching candidates.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.error?.message || "Purchase failed");
    } finally {
      setBoostLoading(false);
    }
  };

  const handleSetReferralBonus = async () => {
    const cents = parseInt(bonusInput) * 100;
    if (!cents || cents < 0) return;
    try {
      await boostApi.setReferralBonus(id!, cents);
      toast.success(`Referral bonus set to $${bonusInput}`);
      setBonusInput("");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed to set bonus");
    }
  };

  const { data: mutualData } = useQuery({
    queryKey: ["mutual-connections", job?.recruiterId],
    queryFn: () => usersApi.getMutualConnections(job!.recruiterId),
    enabled: !!job && !isRecruiter,
  });
  const mutualConnections: MutualConnection[] = (mutualData as any)?.data ?? [];

  if (isLoading) return <ProfileSkeleton />;
  if (jobError) return <p className="text-center text-muted-foreground">Could not load job. Please try again.</p>;
  if (!job) return <p className="text-center text-muted-foreground">Job not found</p>;

  const handleApply = async (d: { resumeUrl: string; coverLetter?: string }) => {
    await apply.mutateAsync(d);
    toast.success("Application submitted!");
    setShowForm(false);
  };

  const handleReferralSubmit = async () => {
    if (!referralModal) return;
    await createReferral.mutateAsync({
      connectorId: referralModal.id,
      jobId: job.id,
      message: referralMessage || null,
    });
    setReferralModal(null);
    setReferralMessage("");
  };

  const handleShortlistToggle = async (candidateId: string) => {
    try {
      const res = await shortlistApi.toggle(candidateId, id);
      const saved = (res as any)?.data?.saved;
      toast.success(saved ? "Saved to shortlist" : "Removed from shortlist");
    } catch (err: any) {
      toast.error(err?.error?.message || "Failed");
    }
  };

  const applyButtonColor =
    matchScore > 60
      ? "bg-green-600 hover:bg-green-700 text-white"
      : matchScore > 30
        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
        : "bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                {job.isFeatured && <span title="Featured"><Sparkles className="h-5 w-5 text-amber-500" /></span>}
                {job.isUrgent && <span title="Urgent Hire"><TrendingUp className="h-5 w-5 text-red-500" /></span>}
                {job.matchScore != null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm",
                      job.matchScore > 60
                        ? "bg-green-100 text-green-800 border-green-200"
                        : job.matchScore > 30
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                    )}
                  >
                    {job.matchScore}% match
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                <Link to={`/company/${job.recruiterId}`} className="hover:underline">{job.recruiter.name}</Link>
                <VerifiedBadge isVerified={job.recruiter.isVerified ?? false} />
              </p>
              <p className="text-sm text-muted-foreground">{job.location} · {timeAgo(job.createdAt)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toggleBookmark.mutate(job.id)}>
              {job.bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Salary</p>
              <p className="font-medium">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge>{job.type.replace("_", " ")}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <Badge variant="outline">{job.level}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Skills</h3>
            <div className="flex flex-wrap gap-1">
              {job.skills.map((s: string) => {
                const isMatch = userSkills.includes(s);
                return (
                  <Badge key={s} variant={isMatch ? "default" : "secondary"}>
                    {s}{isMatch ? " ✓" : ""}
                  </Badge>
                );
              })}
            </div>
          </div>

          {user && !isRecruiter && job.skills?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Your Skill Match</h3>
              <p className="text-sm text-muted-foreground">
                You match <span className="font-semibold">{matchedSkills.length}/{job.skills.length}</span> skills ({matchScore}%)
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    matchScore > 60 ? "bg-green-500" : matchScore > 30 ? "bg-yellow-500" : "bg-gray-400"
                  )}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
          )}

          {user && !isRecruiter && user.id && job.skills?.length > 0 && (
            <SkillGaps userId={user.id} jobId={job.id} compact />
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.description}</p>
          </div>

          {(job.avgResponseDays != null || job.totalHires != null) && (
            <div className="rounded-lg border border-green-100 bg-green-50/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-800">Recruiter Activity</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {job.avgResponseDays != null && (
                  <div className={cn("rounded-md bg-white px-3 py-1.5 shadow-sm", job.avgResponseDays <= 2 ? "text-green-700" : job.avgResponseDays <= 7 ? "text-amber-700" : "text-red-700")}>
                    Responds within <strong>{job.avgResponseDays} day{job.avgResponseDays !== 1 ? "s" : ""}</strong> avg
                  </div>
                )}
                {job.totalHires != null && (
                  <div className="rounded-md bg-white px-3 py-1.5 text-blue-700 shadow-sm">
                    <strong>{job.totalHires}</strong> hire{job.totalHires !== 1 ? "s" : ""} this month
                  </div>
                )}
                {job.activeJobs != null && (
                  <div className="rounded-md bg-white px-3 py-1.5 text-purple-700 shadow-sm">
                    <strong>{job.activeJobs}</strong> active job{job.activeJobs !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {user && !isOwner && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                {showForm ? (
                  <ApplicationForm onSubmit={handleApply} onCancel={() => setShowForm(false)} />
                ) : (
                  <div className="group relative">
                    <Button
                      className={applyButtonColor}
                      onClick={() => matchScore > 30 && setShowForm(true)}
                      disabled={matchScore <= 30}
                    >
                      {matchScore > 60
                        ? "Strong Match - Apply Now"
                        : matchScore > 30
                          ? "Moderate Match - Apply Now"
                          : "Low Match - Apply"}
                    </Button>
                    {matchScore <= 30 && (
                      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Build proof for missing skills
                      </div>
                    )}
                  </div>
                )}
              </div>

              {mutualConnections.length > 0 && !showForm && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                      <UserCheck className="h-4 w-4" />
                      You know {mutualConnections.length} {mutualConnections.length === 1 ? "person" : "people"} at {job.recruiter.name}
                    </div>
                    <div className="mt-3 space-y-2">
                      {mutualConnections.map((conn) => (
                        <div key={conn.id} className="flex items-center justify-between rounded-md bg-white p-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Avatar src={conn.avatar} fallback={conn.name} className="h-8 w-8" />
                            <div>
                              <p className="text-sm font-medium">{conn.name}</p>
                              <p className="text-xs text-muted-foreground">Connected via {conn.via.name}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => setReferralModal(conn)}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Ask for Referral
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader><CardTitle>Boost This Job</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              disabled={boostLoading || job.isFeatured}
              onClick={() => handlePurchaseBoost("FEATURED")}
            >
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              {job.isFeatured ? "Featured ✓" : "$9 — Feature for 7 days"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={boostLoading || job.isUrgent}
              onClick={() => handlePurchaseBoost("URGENT")}
            >
              <Zap className="mr-2 h-4 w-4 text-red-500" />
              {job.isUrgent ? "Urgent ✓" : "$19 — Urgent Hire Boost (3 days)"}
            </Button>
            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-medium">Set Referral Bonus</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount ($)"
                  className="w-32 rounded-md border px-3 py-2 text-sm"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!bonusInput || parseInt(bonusInput) <= 0}
                  onClick={handleSetReferralBonus}
                >
                  <DollarSign className="mr-1 h-4 w-4" />
                  Set Bonus
                </Button>
              </div>
              {job.referralBonus ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Current bonus: ${(job.referralBonus / 100).toFixed(0)} (platform fee: 10%)
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Attract referrals by offering a cash bonus
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Section */}
      {isOwner && (
        <Card>
          <CardHeader className="cursor-pointer select-none" onClick={() => setShowAnalytics(!showAnalytics)}>
            <CardTitle className="text-lg">Analytics {analytics ? `(${analytics.totalApplicants} applicants)` : ""}</CardTitle>
          </CardHeader>
          {showAnalytics && (
            <CardContent>
              <JobAnalytics data={analytics} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Talent Pool Section */}
      {isOwner && (
        <Card>
          <CardHeader className="cursor-pointer select-none" onClick={() => setShowTalentPool(!showTalentPool)}>
            <CardTitle className="text-lg">Matching Candidates {talentPool.length > 0 ? `(${talentPool.length})` : ""}</CardTitle>
          </CardHeader>
          {showTalentPool && (
            <CardContent>
              {talentLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : talentPool.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching candidates found.</p>
              ) : (
                <div className="space-y-3">
                  {talentPool.map((c: any) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <Avatar src={c.avatar} fallback={c.name || "?"} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.headline ?? ""}</p>
                          </div>
                          <Badge variant={c.matchScore > 70 ? "default" : c.matchScore > 40 ? "secondary" : "outline"}>
                            {c.matchScore}%
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.skills?.slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>Level: {c.estimatedLevel}</span>
                          <span>Exp: {c.totalYearsExp}y</span>
                          <span className="cursor-help" title={`Skills: ${c.scoreBreakdown?.skillMatch ?? 0}/40 | Description: ${c.scoreBreakdown?.descriptionMatch ?? 0}/35 | Level: ${c.scoreBreakdown?.experienceLevelMatch ?? 0}/15 | Education: ${c.scoreBreakdown?.educationMatch ?? 0}/10`}>
                            💡 Breakdown
                          </span>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => handleShortlistToggle(c.id)}>
                          Save to Shortlist
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {isOwner && applications.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Applications ({applications.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {applications.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{app.applicant.name}</p>
                  <p className="text-sm text-muted-foreground">{app.applicant.email}</p>
                  <Badge>{app.status}</Badge>
                </div>
                <div className="flex gap-2">
                  {["REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"].map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: app.id, status: s })}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {referralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setReferralModal(null)}>
          <Card className="mx-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">Ask {referralModal.name} for a Referral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send a message to {referralModal.name} asking them to refer you for {job.title}.
              </p>
              <Textarea
                placeholder="Hi, I noticed you work at this company. Would you be open to referring me for this role?"
                value={referralMessage}
                onChange={(e) => setReferralMessage(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleReferralSubmit} disabled={createReferral.isPending}>
                  {createReferral.isPending ? "Sending..." : "Send Request"}
                </Button>
                <Button variant="outline" onClick={() => { setReferralModal(null); setReferralMessage(""); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
