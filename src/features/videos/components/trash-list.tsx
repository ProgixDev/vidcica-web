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
    <div className="flex min-h-16 items-center gap-4 py-3" data-testid="trash-row">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{video.title}</span>
        <span className="text-muted-foreground truncate text-[13px]">
          {t("library.trash.deletedOn", { date: formatDate(new Date(video.deletedAt)) })}
        </span>
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={runRestore}
        disabled={pending}
        data-testid="trash-restore"
        className="shrink-0"
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
          <Link href="/videos" className={buttonVariants({ variant: "secondary" })}>
            {t("videos.title")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="bg-card divide-border flex flex-col divide-y rounded-lg px-5 py-2">
      {videos.map((v) => (
        <TrashRow key={v.id} video={v} />
      ))}
    </div>
  );
}
