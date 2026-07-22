"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  VIDEO_STATUS_KEY,
  isRendering,
  type Video,
  type VideoStatus,
} from "@/lib/vidcica/video";
import { useVideosRealtime } from "@/lib/vidcica/use-videos-realtime";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { deleteVideo, duplicateVideo } from "../actions";

/** Accent- and case-insensitive fold, so "programmee" matches "Programmée". */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Filter chips. Each maps to the set of backend statuses it covers. */
type StatusFilter = "all" | "ready" | "rendering" | "scheduled" | "published";

const FILTER_STATUSES: Record<Exclude<StatusFilter, "all">, readonly VideoStatus[]> = {
  ready: ["pret"],
  rendering: ["generating", "assembling"],
  scheduled: ["programme"],
  published: ["publie", "publishing"],
};

const FILTER_LABEL: Record<StatusFilter, MessageKey> = {
  all: "videos.filterAll",
  ready: "videos.filterReady",
  rendering: "videos.filterRendering",
  scheduled: "videos.filterScheduled",
  published: "videos.filterPublished",
};

const FILTER_ORDER: StatusFilter[] = ["all", "ready", "rendering", "scheduled", "published"];

/** Thumbnail that plays a muted preview on hover when the render is finished
 *  (like the landing showcase); static poster otherwise. */
function Thumb({ video }: { video: Video }) {
  if (!video.videoUrl) {
    return (
      <div
        aria-hidden
        className="bg-muted aspect-[9/16] w-full rounded-md bg-cover bg-center"
        style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})` } : undefined}
      />
    );
  }
  return (
    <video
      src={video.videoUrl}
      poster={video.thumbnailUrl ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      className="bg-muted aspect-[9/16] w-full rounded-md object-cover"
      onMouseEnter={(e) => {
        e.currentTarget.muted = true;
        void e.currentTarget.play().catch(() => undefined);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.pause();
        e.currentTarget.currentTime = 0;
      }}
    />
  );
}

/** Kebab menu over a card: Download (if a finished file exists), Duplicate, Delete.
 *  Sits OUTSIDE the card <Link> (an anchor can't legally wrap buttons) and closes
 *  on outside-click. Mutations reflect via the videos realtime channel; we also
 *  refresh() as a belt-and-braces re-seed. */
function CardMenu({ video }: { video: Video }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const runDuplicate = () => {
    setOpen(false);
    startTransition(async () => {
      const res = await duplicateVideo(video.id);
      if (res.ok) router.refresh();
    });
  };

  const runDelete = () => {
    setOpen(false);
    if (!window.confirm(t("videos.deleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteVideo(video.id);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <button
        type="button"
        aria-label={t("videos.moreActions")}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((o) => !o)}
        data-testid="video-card-menu"
        className="flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {open ? (
        <>
          {/* Outside-click catcher. */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-0 cursor-default"
          />
          <div
            role="menu"
            className="bg-card absolute top-9 right-0 z-10 flex w-40 flex-col overflow-hidden rounded-xl border py-1 shadow-lg"
          >
            {video.videoUrl ? (
              <a
                href={video.videoUrl}
                download
                role="menuitem"
                onClick={() => setOpen(false)}
                data-testid="video-card-download"
                className="hover:bg-muted px-3 py-2 text-left text-sm"
              >
                {t("common.download")}
              </a>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={runDuplicate}
              data-testid="video-card-duplicate"
              className="hover:bg-muted px-3 py-2 text-left text-sm"
            >
              {t("videos.duplicate")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={runDelete}
              data-testid="video-card-delete"
              className="text-destructive hover:bg-destructive/10 px-3 py-2 text-left text-sm"
            >
              {t("common.delete")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const t = useT();
  const meta = STATUS_META[video.status];
  return (
    <div
      className="bg-card hover:border-foreground/20 relative flex flex-col gap-3 rounded-xl border p-3 transition-colors"
      data-testid="video-card"
    >
      <CardMenu video={video} />
      <Link
        href={`/videos/${video.id}`}
        className="focus-visible:ring-ring group flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-2"
      >
        <div className="relative">
          <Thumb video={video} />
          <Badge
            variant={meta.variant}
            className="absolute top-2 left-2"
            data-testid="video-status"
          >
            {isRendering(video.status) ? (
              <span className="bg-primary-foreground/80 size-1.5 animate-pulse rounded-full" />
            ) : null}
            {t(VIDEO_STATUS_KEY[video.status])}
          </Badge>
          {video.durationSec > 0 ? (
            <span
              aria-hidden
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" />
              </svg>
              {t("videos.seconds", { n: Math.round(video.durationSec) })}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="truncate text-sm font-medium">{video.title}</p>
          <p className="text-muted-foreground text-xs">
            {t("videos.formatDuration", { format: video.format, n: Math.round(video.durationSec) })}
          </p>
        </div>
      </Link>
    </div>
  );
}

/**
 * Full video library, seeded server-side (RLS-scoped) and kept live via the
 * videos realtime channel. A client search box (title + hashtags) and status
 * filter chips narrow the list; a per-card menu offers download / duplicate /
 * delete. Renders a real empty state (no videos, or no search match).
 */
export function VideoList({
  userId,
  initial,
  manage = false,
}: {
  userId: string;
  initial: Video[];
  /** Library view: adds the search box + status filter chips over the grid. The
   *  dashboard preview leaves this off and shows a plain grid. Card action menus
   *  are always available. */
  manage?: boolean;
}) {
  const t = useT();
  const videos = useVideosRealtime(userId, initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (!manage) return videos;
    let list = videos;
    if (filter !== "all") {
      const allowed = FILTER_STATUSES[filter];
      list = list.filter((v) => allowed.includes(v.status));
    }
    const q = fold(query.trim());
    if (q) {
      list = list.filter((v) =>
        fold(`${v.title} ${(v.hashtags ?? []).join(" ")} ${v.description ?? ""}`).includes(q),
      );
    }
    return list;
  }, [videos, filter, query, manage]);

  // No videos at all — the create CTA (kept identical to the previous behaviour).
  if (videos.length === 0) {
    return (
      <EmptyState
        className="py-20"
        title={t("videos.emptyTitle")}
        description={t("videos.emptyDescription")}
        action={
          <Link href="/create" className={buttonVariants()}>
            {t("videos.create")}
          </Link>
        }
      />
    );
  }

  // Plain grid (dashboard preview) — no search/filter chrome.
  if (!manage) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        data-testid="video-grid"
      >
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + status chips */}
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("videos.searchPlaceholder")}
          aria-label={t("videos.searchPlaceholder")}
          data-testid="video-search"
          className="rounded-full"
        />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("videos.title")}>
          {FILTER_ORDER.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f)}
                data-testid={`video-filter-${f}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted border-border",
                )}
              >
                {t(FILTER_LABEL[f])}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="py-16"
          title={t("videos.searchEmptyTitle")}
          description={t("videos.searchEmptyDescription")}
        />
      ) : (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          data-testid="video-grid"
        >
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
