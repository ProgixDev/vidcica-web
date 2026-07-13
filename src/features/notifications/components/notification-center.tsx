"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABEL,
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
          {!n.read ? <span className="sr-only">non lu</span> : null}
        </div>
        <span className="text-muted-foreground text-xs">{n.body}</span>
        <span className="text-muted-foreground mt-1 text-[11px]">
          {CATEGORY_LABEL[n.category]} · {relativeTime(n.createdAt)}
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
  const router = useRouter();
  const items = useNotificationsRealtime(userId, initial);
  const unread = unreadCount(items);

  function open(n: AppNotification) {
    if (!n.read) void markRead(n.id).then(() => router.refresh());
  }

  async function readAll() {
    await markAllRead();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5" data-testid="notification-center">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          <span data-testid="unread-count" className="font-semibold">
            {unread}
          </span>{" "}
          <span className="text-muted-foreground">non lues</span>
        </p>
        {unread > 0 ? (
          <Button variant="ghost" size="sm" onClick={readAll} data-testid="mark-all-read">
            Tout marquer comme lu
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="py-16"
          title="Aucune notification"
          description="Vous serez prévenu ici quand une vidéo est prête, une publication réussit ou un paiement passe."
        />
      ) : (
        <div className="flex flex-col gap-2" data-testid="notification-list">
          {items.map((n) => (
            <Row key={n.id} n={n} onOpen={open} />
          ))}
        </div>
      )}
    </div>
  );
}
