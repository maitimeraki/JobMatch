import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "../hooks/useNotifications";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { EmptyState } from "../components/common/EmptyState";
import { timeAgo } from "../lib/utils";

function groupByDate(notifications: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const groups: { label: string; items: any[] }[] = [];
  const todayItems: any[] = [];
  const yesterdayItems: any[] = [];
  const earlierItems: any[] = [];

  for (const n of notifications) {
    const date = new Date(n.createdAt).getTime();
    if (date >= today) todayItems.push(n);
    else if (date >= yesterday) yesterdayItems.push(n);
    else earlierItems.push(n);
  }

  if (todayItems.length) groups.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems });
  if (earlierItems.length) groups.push({ label: "Earlier", items: earlierItems });
  return groups;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const notifications = (data as any)?.data ?? [];
  const hasUnread = notifications.some((n: any) => !n.read);
  const grouped = groupByDate(notifications);

  const handleNotificationClick = (n: any) => {
    if (!n.read) {
      markAsRead.mutate(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <EmptyState icon={<Bell className="h-12 w-12" />} title="No notifications" description="You're all caught up!" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.label}>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">{group.label}</h2>
            <div className="space-y-2">
              {group.items.map((n: any) => (
                <Card
                  key={n.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${n.read ? "" : "border-l-2 border-l-blue-500"}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    {!n.read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm ${n.read ? "" : "font-semibold"}`}>{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
