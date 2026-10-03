"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import {
  NOTIFICATION_CATEGORY_KEY,
  notificationHref,
  relativeTime,
  unreadCount,
  type AppNotification,
} from "@/lib/vidcica/notification";
import { useNotificationsRealtime } from "@/lib/vidcica/use-notifications-realtime";
import { markAllRead, markRead } from "../actions";
import { EnablePushBanner } from "./enable-push-banner";

function Row({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const t = useT();
  const href = notificationHref(n);
  const inner = (
    <div className="flex items-start gap-4 py-4 text-left">
      <span
        aria-hidden
        className={cn(
          "mt-2 size-2 shrink-0 rounded-full",
          n.read ? "bg-transparent" : "bg-foreground",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <span
            className={cn(
              "truncate text-[15px] leading-snug",
              n.read ? "text-subtle-foreground font-medium" : "font-semibold",
            )}
          >
            {n.title}
          </span>
          {!n.read ? <span className="sr-only">{t("notifications.srUnread")}</span> : null}
          <span className="text-muted-foreground shrink-0 text-xs">
            {t(NOTIFICATION_CATEGORY_KEY[n.category])} · {relativeTime(n.createdAt)}
          </span>
        </div>
        <span className="text-muted-foreground text-[13px] leading-relaxed">{n.body}</span>
      </div>
    </div>
  );

  const cls =
    "hover:bg-card focus-visible:ring-ring block w-full rounded-md px-3 transition-colors outline-none focus-visible:ring-2";
  return href ? (
    <Link
      href={href}
      onClick={() => onOpen(n)}
      className={cls}
      data-testid={`notification-${n.id}`}
      data-read={n.read}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cls}
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
    <div className="flex flex-col gap-6" data-testid="notification-center">
      <EnablePushBanner />
      <div className="flex min-h-9 items-center justify-between gap-4">
        <p className="text-[15px]">
          <span data-testid="unread-count" className="font-semibold tabular-nums">
            {unread}
          </span>{" "}
          <span className="text-muted-foreground">{t("notifications.unread")}</span>
        </p>
        {unread > 0 ? (
          <Button variant="secondary" size="sm" onClick={readAll} data-testid="mark-all-read">
            {t("notifications.markAllRead")}
          </Button>
        ) : null}
      </div>

      {message ? (
        <p role="alert" className="text-destructive text-[13px]">
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
        <div className="-mx-3 flex flex-col" data-testid="notification-list">
          {effective.map((n) => (
            <Row key={n.id} n={n} onOpen={open} />
          ))}
        </div>
      )}
    </div>
  );
}
