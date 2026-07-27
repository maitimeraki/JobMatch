import { useState } from "react";
import { useSentReferrals, useReceivedReferrals, useAcceptReferral, useDeclineReferral } from "../hooks/useReferrals";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar } from "../components/ui/avatar";
import { PostSkeleton } from "../components/common/LoadingSkeleton";
import { cn } from "../lib/utils";
import { Building2, Briefcase } from "lucide-react";

const DEMO_RECEIVED: any[] = [
  {
    id: "demo-1",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    message: "Hi! I saw your project showcase on the feed. Your React skills are impressive. I'm hiring for a Senior Frontend role at TechCorp and would love to refer you.",
    requester: { name: "Sarah Chen", avatar: null },
    connector: { name: "You", avatar: null },
    job: { title: "Senior Frontend Engineer @ TechCorp" },
  },
  {
    id: "demo-2",
    status: "ACCEPTED",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    message: "Your Node.js experience matches what we need at WebStudio. Happy to refer you for the Backend Developer position!",
    requester: { name: "Mike Johnson", avatar: null },
    connector: { name: "You", avatar: null },
    job: { title: "Backend Developer @ WebStudio" },
  },
  {
    id: "demo-3",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    message: "I referred Priya for the DevOps role. The team was impressed with her Kubernetes experience!",
    requester: { name: "Priya Patel", avatar: null },
    connector: { name: "You", avatar: null },
    job: { title: "DevOps Engineer (Contract) @ CloudScale" },
    timeline: "Hired - Referral bonus paid ✓",
  },
];

const DEMO_SENT: any[] = [
  {
    id: "demo-4",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    message: "Hi, we met at the React meetup last week. Would you be open to referring me for the Full Stack role at your company? I believe my skills align well.",
    requester: { name: "You", avatar: null },
    connector: { name: "Alex Rivera", avatar: null },
    job: { title: "Full Stack Developer @ InnovateTech" },
  },
  {
    id: "demo-5",
    status: "ACCEPTED",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    message: "I noticed your company is hiring for a Data Science role. Could you refer me? My Python/ML background matches the requirements.",
    requester: { name: "You", avatar: null },
    connector: { name: "Dr. Lisa Wong", avatar: null },
    job: { title: "Data Scientist @ DataDriven Inc" },
  },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function ReferralsDashboard() {
  const [tab, setTab] = useState<"sent" | "received">("received");
  const { data: sentData, isLoading: sentLoading } = useSentReferrals();
  const { data: receivedData, isLoading: receivedLoading } = useReceivedReferrals();
  const acceptReferral = useAcceptReferral();
  const declineReferral = useDeclineReferral();

  const sent: any[] = (sentData as any)?.data?.requests ?? [];
  const received: any[] = (receivedData as any)?.data?.requests ?? [];
  const isLoading = tab === "sent" ? sentLoading : receivedLoading;
  const items = tab === "sent" ? sent : received;

  const acceptedCount = received.filter((r: any) => r.status === "ACCEPTED" || r.status === "COMPLETED").length;
  const respondedCount = received.filter((r: any) => r.status !== "PENDING").length;
  const successRate = respondedCount > 0 ? Math.round((acceptedCount / respondedCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referral Dashboard</h1>
        <div className="text-right text-sm">
          <p className="text-muted-foreground">Success Rate</p>
          <p className="text-xl font-bold text-green-600">{respondedCount > 0 ? `${successRate}%` : "N/A"}</p>
        </div>
      </div>

      {received.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{acceptedCount}</span> accepted ·{" "}
              <span className="font-semibold text-foreground">{received.length - respondedCount}</span> pending
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant={tab === "received" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("received")}
        >
          Received ({received.length})
        </Button>
        <Button
          variant={tab === "sent" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("sent")}
        >
          Sent ({sent.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="space-y-3">
          <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              <Building2 className="mx-auto mb-2 h-8 w-8" />
              <p>No referrals yet. Here&apos;s how referrals work:</p>
              <p className="mt-1 text-xs">Connectors refer candidates to jobs at their company. When hired, the connector earns a referral bonus.</p>
            </CardContent>
          </Card>
          {(tab === "received" ? DEMO_RECEIVED : DEMO_SENT).map((item: any) => (
            <Card key={item.id} className="opacity-70">
              <CardContent className="flex items-start gap-4 p-4">
                <Avatar
                  src={item.requester?.avatar}
                  fallback={tab === "received" ? item.requester?.name?.[0] || "?" : item.connector?.name?.[0] || "?"}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {tab === "received" ? item.requester?.name : item.connector?.name}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {item.job?.title}
                  </p>
                  {item.message && (
                    <p className="mt-1 text-sm text-muted-foreground italic">"{item.message}"</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[item.status] || "")}>
                      {item.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {(item as any).timeline && (
                    <p className="mt-1 text-xs text-green-600">{(item as any).timeline}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-4 p-4">
                <Avatar
                  src={tab === "received" ? item.requester?.avatar : item.connector?.avatar}
                  fallback={tab === "received" ? item.requester?.name?.[0] || "?" : item.connector?.name?.[0] || "?"}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {tab === "received" ? item.requester?.name : item.connector?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tab === "received" ? "requested referral for" : "asked to refer you for"}
                  </p>
                  <p className="text-sm font-medium">{item.job?.title || "Unknown position"}</p>
                  {item.message && (
                    <p className="mt-1 text-sm text-muted-foreground italic">"{item.message}"</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[item.status] || "")}>
                      {item.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {tab === "received" && item.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptReferral.mutate(item.id)}
                      disabled={acceptReferral.isPending}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => declineReferral.mutate(item.id)}
                      disabled={declineReferral.isPending}
                    >
                      Decline
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
