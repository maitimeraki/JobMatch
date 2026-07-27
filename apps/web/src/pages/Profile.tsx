import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, postsApi, endorsementApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { shortlistApi } from "../lib/api";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/text-area";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PostCard } from "../components/feed/PostCard";
import { ProfileSkeleton } from "../components/common/LoadingSkeleton";
import { ProfileStrengthCard } from "../components/profile/ProfileStrength";
import { SkillGaps } from "../components/profile/SkillGaps";
import ProfileEditor from "../components/profile/ProfileEditor";
import { cn } from "../lib/utils";
import { useCreateReferral } from "../hooks/useReferrals";
import { Upload, Download, Send, Edit3, Eye, UserCheck, Building2, Briefcase } from "lucide-react";
import { VerifiedBadge } from "../components/ui/VerifiedBadge";
import toast from "react-hot-toast";

type Tab = "overview" | "portfolio" | "activity";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "portfolio", label: "Portfolio" },
  { key: "activity", label: "Activity" },
];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: profileData, isLoading, error: profileError } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => usersApi.getProfile(id!),
    enabled: !!id,
  });

  const { data: postsData } = useQuery({
    queryKey: ["profile", "posts", id],
    queryFn: () => postsApi.getFeed(undefined, "discovery", undefined, id),
    enabled: !!id,
  }); // ponytail: fetches full feed and filters client-side. Add backend ?authorId param if perf matters

  const { data: endorsementsData } = useQuery({
    queryKey: ["endorsements", id],
    queryFn: () => endorsementApi.getUserEndorsements(id!),
    enabled: !!id,
  });

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const followMutation = useMutation({
    mutationFn: () => usersApi.follow(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", id] });
      toast.success("Followed user");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to follow");
    },
  });

  const shortlistMut = useMutation({
    mutationFn: () => shortlistApi.toggle(id!),
    onSuccess: (res: any) => {
      toast.success(res?.data?.saved ? "Saved to shortlist" : "Removed from shortlist");
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed");
    },
  });

  const saveProfileMut = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", id] });
      toast.success("Profile saved!");
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err?.error?.message || "Failed to save profile");
    },
  });

  const createReferral = useCreateReferral();
  const resumeRef = useRef<HTMLInputElement>(null);

  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/upload", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }, body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const url = json.data?.url;
      if (!url) throw new Error("No URL returned");
      await usersApi.updateProfile({ resumeUrl: url });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile", id] }); toast.success("Resume uploaded"); },
    onError: (err: any) => { toast.error(err?.message || "Failed to upload resume"); },
  });

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadResumeMutation.mutate(file);
  };

  const profile = (profileData as any)?.data?.user;
  const isOwn = currentUser?.id === id;
  const isSeeker = profile?.role === "SEEKER";

  if (isLoading) return <ProfileSkeleton />;
  if (profileError) return <p className="text-center text-muted-foreground">Could not load profile. Please try again.</p>;
  if (!profile) return <p className="text-center text-muted-foreground">User not found</p>;

  const user = profile;
  const prof = profile.profile;
  const experience = prof?.experience
    ? (typeof prof.experience === "string" ? JSON.parse(prof.experience) : prof.experience)
    : [];
  const education = prof?.education
    ? (typeof prof.education === "string" ? JSON.parse(prof.education) : prof.education)
    : [];
  const communityScore = prof?.communityScore ?? 0;

  const allPosts: any[] = (postsData as any)?.data ?? [];
  const showcasePosts = allPosts.filter(
    (p: any) => p.category === "PROJECT_SHOWCASE" && p.authorId === id
  );
  const activityPosts = allPosts.filter((p: any) => p.authorId === id);

  const endorsements: any[] = (endorsementsData as any)?.data?.endorsements ?? [];
  const endorsementsBySkill: Record<string, { skillName: string; count: number }> = {};
  for (const e of endorsements) {
    const skillName = e.skill?.name || "Unknown";
    if (!endorsementsBySkill[skillName]) {
      endorsementsBySkill[skillName] = { skillName, count: 0 };
    }
    endorsementsBySkill[skillName].count++;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          {isOwn && (
            <div className="mb-4 self-end">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="mr-1 h-4 w-4" />{isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          )}
          <Avatar src={user.avatar} fallback={user.name} className="h-24 w-24" />
          <h1 className="mt-4 flex items-center justify-center gap-2 text-2xl font-bold">{user.name} {user.role === "RECRUITER" && <VerifiedBadge isVerified={user.isVerified ?? false} />}</h1>
          {prof?.headline && <p className="text-muted-foreground">{prof.headline}</p>}
          {prof?.location && <p className="text-sm text-muted-foreground">{prof.location}</p>}
          <Badge className="mt-2">{user.role}</Badge>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

          {/* Community Score + Followers */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <span className="text-2xl font-bold text-primary">{communityScore}</span>
              <span className="text-sm text-muted-foreground">Community Score</span>
            </div>
          </div>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{profile.followersCount ?? 0}</strong> followers</span>
            <span><strong className="text-foreground">{profile.followingCount ?? 0}</strong> following</span>
          </div>

          {/* Recruiter Activity Stats (for seekers) */}
          {isSeeker && (
            <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /><strong className="text-foreground">{profile.recruiterSearches ?? 0}</strong> recruiter searches</span>
              <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /><strong className="text-foreground">{profile.recruiterActions ?? 0}</strong> recruiter actions</span>
            </div>
          )}

          {/* Company info (for recruiters) */}
          {user.role === "RECRUITER" && prof?.company && (
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{prof.company}</span>
              {prof.currentRole && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{prof.currentRole}</span>}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!isOwn && currentUser && (
              <Button onClick={() => followMutation.mutate()} disabled={followMutation.isPending}>
                {followMutation.isPending ? "Following..." : "Follow"}
              </Button>
            )}
            {!isOwn && currentUser?.role === "RECRUITER" && user.role === "SEEKER" && (
              <Link to={`/profile/${id}`}>
                <Button variant="secondary">Hire Me</Button>
              </Link>
            )}
            {!isOwn && user.role === "RECRUITER" && (
              <Button variant="secondary" onClick={() => shortlistMut.mutate()} disabled={shortlistMut.isPending}>
                {shortlistMut.isPending ? "Saving..." : "Save to Shortlist"}
              </Button>
            )}
            {!isOwn && currentUser?.role === "SEEKER" && user.role === "SEEKER" && (
              <Button variant="outline" onClick={() => setShowReferralModal(true)}>
                Ask for Referral
              </Button>
            )}
          </div>

          {/* Resume — Seekers only */}
          {isSeeker && (
            <>
              <input type="file" ref={resumeRef} accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
              {prof?.resumeUrl ? (
                <div className="mt-3 flex items-center gap-2">
                  <a href={prof.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Download className="h-4 w-4" /> Download Resume
                  </a>
                  {isOwn && (
                    <Button variant="outline" size="sm" onClick={() => resumeRef.current?.click()} disabled={uploadResumeMutation.isPending}>
                      <Upload className="mr-1 h-3 w-3" /> {uploadResumeMutation.isPending ? "Uploading..." : "Change"}
                    </Button>
                  )}
                </div>
              ) : isOwn ? (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => resumeRef.current?.click()} disabled={uploadResumeMutation.isPending}>
                  <Upload className="mr-1 h-4 w-4" /> {uploadResumeMutation.isPending ? "Uploading..." : "Upload Resume"}
                </Button>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile Editor (inline, own profile only) */}
      {isOwn && isEditing && (
        <ProfileEditor
          profile={prof}
          role={user.role}
          onSave={async (data) => { await saveProfileMut.mutateAsync(data); }}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReferralModal(false)}>
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Ask {user.name} for a Referral</h2>
            <p className="mt-1 text-sm text-muted-foreground">Send a message explaining what role you're looking for.</p>
            <Textarea
              className="mt-4"
              placeholder="Hi, I'm looking for a frontend role at your company..."
              value={referralMessage}
              onChange={(e) => setReferralMessage(e.target.value)}
              rows={4}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReferralModal(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  createReferral.mutate(
                    { connectorId: id!, jobId: null, message: referralMessage },
                    { onSuccess: () => setShowReferralModal(false) }
                  );
                }}
                disabled={createReferral.isPending || !referralMessage.trim()}
              >
                <Send className="mr-1 h-4 w-4" /> Send Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {isOwn && user.role === "SEEKER" && (
            <ProfileStrengthCard userId={id!} />
          )}

          {prof?.bio && (
            <Card>
              <CardHeader><CardTitle>About</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{prof.bio}</p></CardContent>
            </Card>
          )}

          {prof?.skills && prof.skills.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {prof.skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {isOwn && user.role === "SEEKER" && (
            <SkillGaps userId={id!} />
          )}

          {/* Endorsements */}
          {endorsements.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Endorsements</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(endorsementsBySkill).map((entry) => (
                    <div key={entry.skillName} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{entry.skillName}</span>
                      <Badge variant="secondary">
                        {entry.count} endorsement{entry.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {experience.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {experience.map((exp: any, i: number) => (
                  <div key={i} className="border-l-2 border-muted pl-4">
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : " - Present"}
                    </p>
                    {exp.description && <p className="mt-1 text-sm">{exp.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {education.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Education</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {education.map((edu: any, i: number) => (
                  <div key={i}>
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-sm text-muted-foreground">{edu.school} &middot; {edu.year}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          {showcasePosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No project showcases yet</p>
              </CardContent>
            </Card>
          ) : (
            showcasePosts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => {}}
                onComment={() => {}}
                isOwn={isOwn}
              />
            ))
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          {activityPosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No recent activity</p>
              </CardContent>
            </Card>
          ) : (
            activityPosts.map((post: any) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => {}}
                onComment={() => {}}
                isOwn={isOwn}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
