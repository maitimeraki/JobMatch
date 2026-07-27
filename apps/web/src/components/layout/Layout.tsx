import { Outlet, Link, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Home, Briefcase, FileText, Bell, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";

const commonNavItems = [
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Profile", icon: User, path: "/profile/:id" },
];

const seekerNavItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "Applications", icon: FileText, path: "/applications" },
];

const recruiterNavItems = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "Shortlist", icon: FileText, path: "/shortlist" },
];

export function Layout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const profilePath = user ? `/profile/${user.id}` : "/profile/:id";

  const isActive = (path: string) => {
    if (path === "/profile/:id") {
      return location.pathname.startsWith("/profile/");
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-20 lg:pb-6">
        <Outlet />
      </main>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
        <div className="flex items-center justify-around py-2">
          {(user?.role === "RECRUITER" ? recruiterNavItems : seekerNavItems).map((item) => {
            const href = item.path === "/profile/:id" ? profilePath : item.path;
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {commonNavItems.map((item) => {
            const href = item.path === "/profile/:id" ? profilePath : item.path;
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
