"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import {
  NOTIFICATION_CATEGORY_KEY,
  TYPE_VARIANT,
  notificationHref,
  relativeTime,
  unreadCount,
  type AppNotification,
} from "@/lib/vidcica/notification";
import { useNotificationsRealtime } from "@/lib/vidcica/use-notifications-realtime";
import { markAllRead, markRead } from "../actions";

const DOT = {
  success: "bg-success",
  warning: "bg-warning",
  brand: "bg-primary",
} as const;

function Row({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const t = useT();
  const href = notificationHref(n);
  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        n.read ? "bg-card" : "bg-accent/40 border-primary/30",
      )}
    >
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[TYPE_VARIANT[n.type]])}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm", n.read ? "font-medium" : "font-semibold")}>
            {n.title}
          </span>
          {!n.read ? <span className="sr-only">{t("notifications.srUnread")}</span> : null}
        </div>
        <span className="text-muted-foreground text-xs">{n.body}</span>
        <span className="text-muted-foreground mt-1 text-[11px]">
          {t(NOTIFICATION_CATEGORY_KEY[n.category])} · {relativeTime(n.createdAt)}
        </span>
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      onClick={() => onOpen(n)}
      className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      data-testid={`notification-${n.id}`}
      data-read={n.read}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className="focus-visible:ring-ring block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      data-testid={`notification-${n.id}`}
      data-read={n.read}
    >
      {inner}
    </button>
  );
}

export function NotificationCenter({
  userId,
  initial,
}: {
  userId: string;
  initial: AppNotification[];
}) {
  const t = useT();
  const items = useNotificationsRealtime(userId, initial);
  // Optimistic read overlay: flip immediately, roll back if the write fails.
  // Realtime/next-load reconciles the authoritative state.
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState<string | null>(null);

  const effective = items.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));
  const unread = unreadCount(effective);

  function open(n: AppNotification) {
    if (n.read || readIds.has(n.id)) return;
    setReadIds((s) => new Set(s).add(n.id));
    setMessage(null);
    void markRead(n.id).then((res) => {
      if (!res.ok) {
        setReadIds((s) => {
          const next = new Set(s);
          next.delete(n.id);
          return next;
        });
        setMessage(res.message);
      }
    });
  }

  async function readAll() {
    const unreadIds = effective.filter((n) => !n.read).map((n) => n.id);
    setReadIds((s) => new Set([...s, ...unreadIds]));
    setMessage(null);
    const res = await markAllRead();
    if (!res.ok) {
      setReadIds((s) => {
        const next = new Set(s);
        for (const id of unreadIds) next.delete(id);
        return next;
      });
      setMessage(res.message);
    }
  }

  return (
    <div className="flex flex-col gap-5" data-testid="notification-center">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          <span data-testid="unread-count" className="font-semibold">
            {unread}
          </span>{" "}
          <span className="text-muted-foreground">{t("notifications.unread")}</span>
        </p>
        {unread > 0 ? (
          <Button variant="ghost" size="sm" onClick={readAll} data-testid="mark-all-read">
            {t("notifications.markAllRead")}
          </Button>
        ) : null}
      </div>

      {message ? (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      ) : null}

      {effective.length === 0 ? (
        <EmptyState
          className="py-16"
          title={t("notifications.emptyTitle")}
          description={t("notifications.emptyDescription")}
        />
      ) : (
        <div className="flex flex-col gap-2" data-testid="notification-list">
          {effective.map((n) => (
            <Row key={n.id} n={n} onOpen={open} />
          ))}
        </div>
      )}
    </div>
  );
}
