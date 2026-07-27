import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Briefcase, LayoutDashboard, Shield, Sun, Moon } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import { useNotifications, useUnreadCount, useMarkAllAsRead } from "../../hooks/useNotifications";
import { useTheme } from "../../hooks/useTheme";
import { cn, timeAgo } from "../../lib/utils";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: notifData } = useNotifications();
  const markAllRead = useMarkAllAsRead();
  const { theme, toggle: toggleTheme } = useTheme();
  const unread = (unreadData as any)?.data?.count ?? 0;
  const notifications: any[] = (notifData as any)?.data ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <Briefcase className="h-6 w-6 text-primary" />
            JobMatch
          </Link>
          <nav className="ml-8 hidden items-center gap-1 md:flex">
            {user?.role === "RECRUITER" ? (
              <>
                <Link to="/dashboard" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Dashboard
                </Link>
                <Link to="/jobs" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Jobs
                </Link>
                <Link to="/shortlist" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Shortlist
                </Link>
                <Link to="/people" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  People
                </Link>
                <Link to="/referrals" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Referral
                </Link>
              </>
            ) : user?.role === "SEEKER" ? (
              <>
                <Link to="/feed" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Feed
                </Link>
                <Link to="/jobs" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Jobs
                </Link>
                <Link to="/applications" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Applications
                </Link>
                <Link to="/people" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  People
                </Link>
                <Link to="/referrals" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Referral
                </Link>
              </>
            ) : (
              <>
                <Link to="/feed" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Feed
                </Link>
                <Link to="/people" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  People
                </Link>
                <Link to="/jobs" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Jobs
                </Link>
              </>
            )}
            <Link to="/pricing" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="relative" ref={notifRef}>
                <Button variant="ghost" size="icon" className="relative" onClick={() => setNotifOpen(!notifOpen)}>
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      {unread > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={() => markAllRead.mutate()}>
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
                      ) : (
                        notifications.slice(0, 5).map((n: any) => (
                          <button
                            key={n.id}
                            className={cn(
                              "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                              !n.read && "border-l-2 border-primary bg-primary/5"
                            )}
                            onClick={() => {
                              setNotifOpen(false);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                          </button>
                        ))
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      className="block border-t p-3 text-center text-sm font-medium text-primary hover:bg-muted/50"
                      onClick={() => setNotifOpen(false)}
                    >
                      See all notifications
                    </Link>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link to={user?.role === "RECRUITER" ? "/dashboard" : "/feed"} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              {user?.role === "ADMIN" && (
                <Link to="/admin" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Shield className="h-5 w-5" />
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Link to={`/profile/${user?.id}`}>
                  <Avatar src={user?.avatar} fallback={user?.name || "U"} className="h-8 w-8 cursor-pointer" />
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                Log in
              </Link>
              <Link to="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
