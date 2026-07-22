"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_META, VIDEO_STATUS_KEY, type Video } from "@/lib/vidcica/video";
import { useT } from "@/lib/i18n/provider";
import { deleteVideo } from "../actions";

/**
 * Finished-video surface: plays the rendered MP4 and offers download + publish
 * (AC-14), plus share (copy the page link to the clipboard) and delete
 * (soft-delete → trash, confirmed). Shows the video's hashtags. Mutations reflect
 * by navigating back to the library, which re-seeds from the server.
 */
export function VideoDetail({ video }: { video: Video }) {
  const t = useT();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[video.status];

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

  return (
    <div className="flex flex-col gap-5" data-testid="video-detail">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{video.title}</h2>
        <Badge variant={meta.variant}>{t(VIDEO_STATUS_KEY[video.status])}</Badge>
      </div>

      {video.videoUrl ? (
        <video
          controls
          playsInline
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          className="bg-muted mx-auto aspect-[9/16] max-h-[70dvh] w-auto rounded-xl"
          data-testid="video-player"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {video.videoUrl ? (
          <a
            href={video.videoUrl}
            download
            className={buttonVariants({ variant: "default" })}
            data-testid="download-btn"
          >
            {t("videos.downloadMp4")}
          </a>
        ) : null}
        <Link
          href={`/videos/${video.id}/publish`}
          className={buttonVariants({ variant: "outline" })}
          data-testid="publish-link"
        >
          {t("common.publish")}
        </Link>
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
        <span className="text-muted-foreground text-xs">
          {t("videos.formatDuration", { format: video.format, n: Math.round(video.durationSec) })}
        </span>
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
    </div>
  );
}
