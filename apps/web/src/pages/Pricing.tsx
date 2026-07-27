import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, X, TrendingUp, Sparkles, Loader2, Briefcase, User } from "lucide-react";
import { subscriptionApi } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { cn } from "../lib/utils";

const RECRUITER_TIERS = [
  {
    name: "Starter",
    price: "Free",
    description: "For teams getting started",
    popular: false,
    tierKey: "FREE",
    features: [
      { text: "Post 1 active job at a time", included: true },
      { text: "View up to 10 applicants per job", included: true },
      { text: "Basic pipeline management", included: true },
      { text: "Community feed access", included: true },
      { text: "Unlimited job listings", included: false },
      { text: "Full candidate post history", included: false },
      { text: "Priority placement in search", included: false },
      { text: "Analytics dashboard", included: true },
      { text: "Download applicant CSV", included: false },
      { text: "Featured Job badge", included: false },
    ],
  },
  {
    name: "Pro Recruiter",
    price: "$29",
    period: "/month",
    description: "For serious hiring teams",
    popular: true,
    tierKey: "PRO",
    features: [
      { text: "Post unlimited jobs", included: true },
      { text: "Unlimited candidate profiles", included: true },
      { text: "Full post history & endorsements", included: true },
      { text: "Advanced pipeline with notes", included: true },
      { text: "Priority placement in search", included: true },
      { text: "Download applicant CSV", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Featured Job badge", included: true },
      { text: "Email alerts for new matches", included: true },
      { text: "Urgent Hire Boost (add-on)", included: true },
    ],
  },
];

const SEEKER_TIERS = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with job hunting",
    popular: false,
    features: [
      { text: "Browse & apply to jobs", included: true },
      { text: "Build professional profile", included: true },
      { text: "Basic skill endorsements", included: true },
      { text: "Community feed access", included: true },
      { text: "Referral requests", included: true },
      { text: "Profile insights & analytics", included: false },
      { text: "Skill gap analysis", included: false },
      { text: "Priority applications", included: false },
      { text: "Resume review", included: false },
    ],
  },
  {
    name: "Premium",
    price: "$12",
    period: "/month",
    description: "Stand out & get hired faster",
    popular: true,
    features: [
      { text: "Browse & apply to jobs", included: true },
      { text: "Build professional profile", included: true },
      { text: "Advanced skill endorsements", included: true },
      { text: "Community feed access", included: true },
      { text: "Referral requests", included: true },
      { text: "Profile insights & analytics", included: true },
      { text: "Skill gap analysis", included: true },
      { text: "Priority applications", included: true },
      { text: "Resume review", included: true },
    ],
  },
];

const ADDONS = [
  { name: "Featured Job Listing", price: "$9", period: "per job", desc: "Featured badge + top of search for 7 days", icon: Sparkles },
  { name: "Urgent Hire Boost", price: "$19", period: "per job", desc: "Red highlight, pinned 3 days, notified to matching candidates", icon: TrendingUp },
];

export default function Pricing() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"recruiter" | "seeker">("recruiter");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Auto-select tab based on user role
  useEffect(() => {
    if (user?.role === "SEEKER") setTab("seeker");
    else if (user?.role === "RECRUITER") setTab("recruiter");
  }, [user]);

  useEffect(() => {
    if (user?.role === "RECRUITER") {
      subscriptionApi.getPlan().then((res: any) => {
        setCurrentPlan(res.data?.plan?.tier || "FREE");
      }).catch(() => {});
    }
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) { navigate("/register"); return; }
    setLoading(true);
    setMessage(null);
    try {
      const res: any = await subscriptionApi.upgrade();
      setCurrentPlan("PRO");
      setMessage(res.data?.message || "Upgraded to Pro!");
    } catch (err: any) {
      setMessage(err?.error?.message || "Upgrade failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await subscriptionApi.downgrade();
      setCurrentPlan("FREE");
      setMessage("Downgraded to Free plan.");
    } catch (err: any) {
      setMessage(err?.error?.message || "Downgrade failed.");
    } finally {
      setLoading(false);
    }
  };

  const tierData = tab === "recruiter" ? RECRUITER_TIERS : SEEKER_TIERS;

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Plans & Pricing</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {tab === "recruiter" ? "Start free. Upgrade when you need more hiring power." : "Start free. Upgrade to accelerate your job search."}
        </p>
        {message && (
          <p className="mt-2 text-sm font-medium text-primary">{message}</p>
        )}
        {currentPlan && (
          <Badge variant="outline" className="mt-2">
            Current plan: {currentPlan}
          </Badge>
        )}
      </div>

      {/* Role Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setTab("recruiter")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "recruiter" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Briefcase className="h-4 w-4" />
            For Recruiters
          </button>
          <button
            onClick={() => setTab("seeker")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "seeker" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4" />
            For Job Seekers
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {tierData.map((tier: any) => {
          const isCurrent = tab === "recruiter" && currentPlan === tier.tierKey;
          return (
            <Card key={tier.name} className={`relative ${tier.popular ? "shadow-lg ring-2 ring-primary" : "border-muted"}`}>
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((f: any) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                {tab === "recruiter" ? (
                  isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : tier.tierKey === "FREE" ? (
                    <Button className="w-full" variant="outline" onClick={handleDowngrade} disabled={loading || user?.role !== "RECRUITER"}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Downgrade
                    </Button>
                  ) : (
                    <Button className="w-full" variant="default" onClick={handleUpgrade} disabled={loading || (!!user && user.role !== "RECRUITER")}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!user ? "Sign Up to Get Started" : "Upgrade to Pro"}
                    </Button>
                  )
                ) : (
                  tier.name === "Free" ? (
                    <Button className="w-full" variant="outline" disabled={!!user}>
                      {user ? "Current Plan" : "Get Started Free"}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="default" disabled>
                      Coming Soon
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add-ons section — shown for recruiters */}
      {tab === "recruiter" && (
        <div>
          <h2 className="mb-6 text-center text-2xl font-bold">Need Extra Reach?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ADDONS.map((addon) => {
              const Icon = addon.icon;
              return (
                <Card key={addon.name}>
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{addon.name}</h3>
                        <span className="text-lg font-bold">{addon.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{addon.period}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{addon.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {tab === "recruiter"
            ? "No risk. If you don't find better candidates within 30 days, we'll refund your first month."
            : "All plans include access to our professional community. Upgrade anytime."}
        </p>
      </div>
    </div>
  );
}
