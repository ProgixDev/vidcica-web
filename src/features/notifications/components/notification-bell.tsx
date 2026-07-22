"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { unreadCount, type AppNotification } from "@/lib/vidcica/notification";
import { useNotificationsRealtime } from "@/lib/vidcica/use-notifications-realtime";

/** Dashboard entry point: a link to the centre with a live unread badge. */
export function NotificationBell({
  userId,
  initial,
}: {
  userId: string;
  initial: AppNotification[];
}) {
  const t = useT();
  const items = useNotificationsRealtime(userId, initial);
  const unread = unreadCount(items);

  return (
    <Link
      href="/notifications"
      className="text-muted-foreground hover:text-foreground relative inline-flex items-center gap-1.5 text-sm"
      data-testid="notification-bell"
    >
      {t("notifications.bellLabel")}
      {unread > 0 ? (
        <span
          aria-label={t("notifications.unreadAria", { count: unread })}
          className={cn(
            "bg-primary text-primary-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
          )}
          data-testid="bell-count"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
