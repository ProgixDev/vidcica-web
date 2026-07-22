"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { TrashedVideo } from "@/lib/vidcica/videos-queries";
import { restoreVideo } from "../actions";

/** One trash row: title + trashed-date, with a Restore action on the right. */
function TrashRow({ video }: { video: TrashedVideo }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const runRestore = () => {
    startTransition(async () => {
      const res = await restoreVideo(video.id);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3" data-testid="trash-row">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{video.title}</span>
        <span className="text-muted-foreground truncate text-xs">
          {t("library.trash.deletedOn", { date: formatDate(new Date(video.deletedAt)) })}
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={runRestore}
        disabled={pending}
        data-testid="trash-restore"
        className="shrink-0 rounded-full"
      >
        {pending ? t("common.loading") : t("library.trash.restore")}
      </Button>
    </div>
  );
}

/**
 * The caller's soft-deleted videos, seeded server-side (RLS-scoped). Each row can
 * be restored (clears `deleted_at`); an honest empty state covers an empty trash.
 * A 30-day purge cron finalises deletion — surfaced in the page copy, not here.
 */
export function TrashList({ initial }: { initial: TrashedVideo[] }) {
  const t = useT();
  const videos = initial;

  if (videos.length === 0) {
    return (
      <EmptyState
        className="py-20"
        title={t("library.trash.emptyTitle")}
        description={t("library.trash.emptyDescription")}
        action={
          <Link href="/videos" className={buttonVariants({ variant: "outline" })}>
            {t("videos.title")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
      {videos.map((v) => (
        <TrashRow key={v.id} video={v} />
      ))}
    </div>
  );
}
