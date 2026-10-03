"use client";

import Link from "next/link";
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
      className="bg-secondary text-foreground hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      data-testid="notification-bell"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span className="sr-only">{t("notifications.bellLabel")}</span>
      {unread > 0 ? (
        // Unread = a small ink dot; the count stays available to assistive tech.
        <span
          aria-label={t("notifications.unreadAria", { count: unread })}
          className="bg-foreground ring-secondary absolute top-2 right-2 size-2.5 rounded-full ring-2"
          data-testid="bell-count"
        >
          <span className="sr-only">{unread > 99 ? "99+" : unread}</span>
        </span>
      ) : null}
    </Link>
  );
}
