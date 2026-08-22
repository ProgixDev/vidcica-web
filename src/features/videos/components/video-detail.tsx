"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/platform-icon";
import { STATUS_META, VIDEO_STATUS_KEY, type Video } from "@/lib/vidcica/video";
import { useT } from "@/lib/i18n/provider";
import { PLATFORMS, type PlatformId } from "@/lib/vidcica/network";
import { canUnpublish, publicPostUrl } from "@/lib/vidcica/publishing";
import type { PublishTarget } from "@/lib/vidcica/queries";
import { deleteVideo, duplicateVideo, unpublishVideo } from "../actions";

/** Brand-correct label ("YouTube", not "Youtube") for confirm copy. */
function platformLabel(p: PlatformId): string {
  return PLATFORMS.find((x) => x.id === p)?.label ?? p;
}

/**
 * Finished-video surface: plays the rendered MP4 and exposes what the mobile
 * screen offers (ClipFlow app/video/[id].tsx) — publish/republish, download,
 * boost, duplicate, share, delete — plus where it was published and how it
 * performed.
 *
 * LAYOUT: two-up from `lg` — player left, everything else right. A 9:16 player
 * is ~600px tall, so the previous single narrow column pushed the action row
 * below the fold (you had to scroll to reach Delete) while the right half of a
 * desktop window sat empty. The player is sticky so it stays in view while the
 * right column scrolls. Below `lg` it collapses back to one column, player first.
 *
 * NOTE (2026-08-21): this screen used to be unreachable for published videos.
 * The page gated on `isReady`, which is false once status flips to `publie`, so
 * a published video rendered the render-progress bar stuck at 100% with no
 * player and no actions at all. The page now gates on `hasRenderedVideo`.
 */

/** Deterministic compact number — no `Intl` with an implicit locale, because
 *  this client component also renders on the server and a locale-dependent
 *  string would mismatch on hydration. */
function compact(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
}

export function VideoDetail({
  video,
  targets = [],
}: {
  video: Video;
  /** Live publish targets + post ids, from publish_jobs. Authoritative over
   *  video.networks because it also carries the id needed to link out. */
  targets?: ReadonlyArray<PublishTarget>;
}) {
  const t = useT();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [unpublishMsg, setUnpublishMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[video.status];

  // "Has it gone out?" — drives the republish wording and whether performance
  // is worth showing. `networks` is the authoritative list (written per
  // successful publish job); status alone lags for partially-published videos.
  const isPublished = video.networks.length > 0 || video.status === "publie";

  // Pexels' API licence requires a visible credit wherever stock footage is
  // shown. The poster keeps its pexels URL even after the MP4 is re-hosted, so
  // checking both fields reliably flags stock. Mirrors the mobile screen.
  const usesStock =
    (video.thumbnailUrl ?? "").includes("pexels") || (video.videoUrl ?? "").includes("pexels");

  const onShare = async () => {
    // Copy the canonical page URL so it can be pasted anywhere. navigator.clipboard
    // needs a secure context; fall back to a hidden selection when it's absent.
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — leave the label unchanged
    }
  };

  const onDuplicate = () => {
    startTransition(async () => {
      const res = await duplicateVideo(video.id);
      // Land on the copy rather than just refreshing: on a detail screen the
      // intent is to work on the duplicate, not to keep staring at the original.
      if (res.ok) {
        router.push(`/videos/${res.id}`);
        router.refresh();
      }
    });
  };

  const onUnpublish = (platform: PlatformId) => {
    if (!window.confirm(t("videos.unpublishConfirm", { platform: platformLabel(platform) }))) {
      return;
    }
    setUnpublishMsg(null);
    startTransition(async () => {
      const res = await unpublishVideo(video.id, platform);
      if (res.ok) {
        setUnpublishMsg(t("videos.unpublishDone"));
        router.refresh(); // re-reads networks, which delete-post has just drained
        return;
      }
      setUnpublishMsg(
        res.reason === "not_deletable"
          ? t("videos.unpublishNotDeletable")
          : res.reason === "reconnect_required"
            ? t("videos.unpublishReconnect")
            : t("videos.unpublishFailed"),
      );
    });
  };

  const onDelete = () => {
    if (!window.confirm(t("videos.deleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteVideo(video.id);
      if (res.ok) {
        router.push("/videos");
        router.refresh();
      }
    });
  };

  const metrics = [
    { key: "videos.metrics.views", value: video.views },
    { key: "videos.metrics.likes", value: video.likes },
    { key: "videos.metrics.comments", value: video.comments },
    { key: "videos.metrics.shares", value: video.shares },
  ] as const;

  return (
    <div
      className="grid w-full max-w-6xl gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-8"
      data-testid="video-detail"
    >
      {/* Player. `auto` column + a height-capped 9:16 element means the column
          sizes to the video's natural width, so the right column takes the rest. */}
      {video.videoUrl ? (
        <video
          controls
          playsInline
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          className="bg-muted mx-auto aspect-[9/16] max-h-[62dvh] w-auto rounded-xl lg:sticky lg:top-4"
          data-testid="video-player"
        />
      ) : null}

      {/* Everything else */}
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{video.title}</h2>
            <Badge variant={meta.variant}>{t(VIDEO_STATUS_KEY[video.status])}</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {t("videos.formatDuration", { format: video.format, n: Math.round(video.durationSec) })}
          </p>
        </div>

        {/* Where it is live, with a way through to each post */}
        {targets.length > 0 ? (
          <div className="flex flex-col gap-2" data-testid="video-networks">
            <span className="text-muted-foreground text-xs font-medium">
              {t("videos.publishedOn")}
            </span>
            <ul className="flex flex-col gap-1.5">
              {targets.map(({ platform: p, externalPostId }) => {
                const url = publicPostUrl(p, externalPostId);
                return (
                  <li
                    key={p}
                    className="bg-muted flex flex-wrap items-center gap-2 rounded-xl px-3 py-2"
                  >
                    <PlatformIcon platform={p} size={20} />
                    <span className="flex-1 text-sm font-medium">{platformLabel(p)}</span>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs font-medium underline underline-offset-2"
                        data-testid={`open-post-${p}`}
                      >
                        {t("videos.viewPost")}
                      </a>
                    ) : (
                      // TikTok stores a publish id and Instagram/Threads a media
                      // id, neither of which yields a public URL. Say so rather
                      // than ship a link that 404s.
                      <span className="text-muted-foreground text-[11px]">
                        {t("videos.viewPostUnavailable")}
                      </span>
                    )}
                    {canUnpublish(p) ? (
                      <button
                        type="button"
                        onClick={() => onUnpublish(p)}
                        disabled={pending}
                        className="hover:bg-background rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-50"
                        data-testid={`unpublish-${p}`}
                      >
                        {t("videos.unpublish")}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {unpublishMsg ? (
              <p className="text-muted-foreground text-[11px]" data-testid="unpublish-msg">
                {unpublishMsg}
              </p>
            ) : null}
          </div>
        ) : null}
        {/* Performance — only meaningful once something has actually gone out. */}
        {isPublished ? (
          <div className="flex flex-col gap-2" data-testid="video-metrics">
            <p className="text-muted-foreground text-xs font-medium">{t("videos.metrics.title")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metrics.map((m) => (
                <div key={m.key} className="bg-muted flex flex-col gap-0.5 rounded-xl px-3 py-2">
                  <span className="text-base font-semibold tabular-nums">{compact(m.value)}</span>
                  <span className="text-muted-foreground text-[11px]">{t(m.key)}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-[11px]">{t("videos.metrics.hint")}</p>
          </div>
        ) : null}

        {/* Actions — primary first, destructive last. */}
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium">{t("videos.actions.title")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/videos/${video.id}/publish`}
              className={buttonVariants({ variant: "default" })}
              data-testid="publish-link"
            >
              {isPublished ? t("videos.republish") : t("common.publish")}
            </Link>
            {video.videoUrl ? (
              <a
                href={video.videoUrl}
                download
                className={buttonVariants({ variant: "outline" })}
                data-testid="download-btn"
              >
                {t("videos.downloadMp4")}
              </a>
            ) : null}
            {/* Mirrors the mobile app's "Booster avec Meta Ads" card. The wizard
                resolves ?videoId= against the user's own videos, so an unknown id
                degrades to the normal picker rather than seeding an unusable draft. */}
            <Link
              href={`/ads/new?videoId=${encodeURIComponent(video.id)}`}
              className={buttonVariants({ variant: "outline" })}
              data-testid="boost-link"
            >
              {t("videos.boost")}
            </Link>
            <Button
              variant="outline"
              onClick={onDuplicate}
              disabled={pending}
              data-testid="duplicate-btn"
            >
              {t("videos.duplicate")}
            </Button>
            <Button variant="outline" onClick={onShare} data-testid="share-btn">
              {copied ? t("videos.linkCopied") : t("videos.copyLink")}
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={pending}
              data-testid="delete-btn"
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>

        {video.hashtags.length > 0 ? (
          <div className="flex flex-col gap-2" data-testid="video-hashtags">
            <p className="text-muted-foreground text-xs font-medium">{t("videos.hashtagsLabel")}</p>
            <div className="flex flex-wrap gap-1.5">
              {video.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="bg-accent text-accent-foreground rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {usesStock ? (
          <p className="text-muted-foreground text-[11px]" data-testid="stock-attribution">
            {t("videos.stockAttribution")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
