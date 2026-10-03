"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { m } from "@/components/motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import { canBeYouTubeShort } from "@/lib/vidcica/video";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import type { NetworkStatus, PlatformId } from "@/lib/vidcica/network";
import {
  usePublishJobsRealtime,
  type PublishJobView,
} from "@/lib/vidcica/use-publish-jobs-realtime";
import { usePublishStore } from "../provider";
import { NativeCardPreview } from "./native-card-preview";
import { TikTokOptions } from "./tiktok-options";

/** A publish-target platform + its connection state (computed server-side). */
export type PublishablePlatform = {
  id: PlatformId;
  label: string;
  status: NetworkStatus;
  handle?: string;
};

/** The video fields the preview needs (honest caption source). */
export type PublishPreviewVideo = {
  id: string;
  title: string;
  description?: string;
  hashtags: string[];
  thumbnailUrl: string | null;
  durationSec: number;
  format: string;
};

const REASON_LABEL: Record<string, MessageKey> = {
  auth_expired: "publish.reasonAuthExpired",
  encoding: "publish.reasonEncoding",
  rate_limited: "publish.reasonRateLimited",
  rejected: "publish.reasonRejected",
  unknown: "publish.reasonUnknown",
};

function statusView(
  v: PublishJobView | undefined,
  t: ReturnType<typeof useT>,
): {
  label: string;
  variant: "muted" | "brand" | "success" | "warning";
} {
  if (!v) return { label: t("publish.statusPending"), variant: "muted" };
  if (v.status === "succeeded") return { label: t("publish.statusPublished"), variant: "success" };
  if (v.status === "failed")
    return {
      label: t(REASON_LABEL[v.reason ?? "unknown"] ?? "publish.reasonUnknown"),
      variant: "warning",
    };
  return { label: t("publish.statusPublishing"), variant: "brand" };
}

/** Default caption body seeded into the editor (title + description). Hashtags
 *  are rendered separately in the preview and appended to the override at confirm. */
function buildCaption(video: PublishPreviewVideo): string {
  return [video.title, video.description].filter(Boolean).join("\n");
}

export function PublishFlow({
  userId,
  platforms,
  video,
}: {
  userId: string;
  platforms: PublishablePlatform[];
  video: PublishPreviewVideo;
}) {
  const videoId = usePublishStore((s) => s.videoId);
  const selected = usePublishStore((s) => s.selected);
  const mode = usePublishStore((s) => s.mode);
  const asShort = usePublishStore((s) => s.youtubeAsShort);
  const phase = usePublishStore((s) => s.phase);
  const error = usePublishStore((s) => s.error);
  const skipped = usePublishStore((s) => s.skipped);
  const scheduledAt = usePublishStore((s) => s.scheduledAt);
  const toggle = usePublishStore((s) => s.togglePlatform);
  const setMode = usePublishStore((s) => s.setMode);
  const setScheduledAt = usePublishStore((s) => s.setScheduledAt);
  const setShort = usePublishStore((s) => s.setYoutubeAsShort);
  const captions = usePublishStore((s) => s.captions);
  const setCaption = usePublishStore((s) => s.setCaption);
  const canConfirm = usePublishStore((s) => s.canConfirm);
  const confirm = usePublishStore((s) => s.confirm);
  const tiktokCreator = usePublishStore((s) => s.tiktokCreator);

  const t = useT();
  const statuses = usePublishJobsRealtime(userId, videoId);
  const connectable = platforms.filter((p) => p.status === "connected");
  const defaultCaption = useMemo(() => buildCaption(video), [video]);

  // The platform shown in the right-hand preview. Defaults to the first
  // selected one, else the first connected one, else the first platform.
  const [previewTab, setPreviewTab] = useState<PlatformId | null>(null);
  const activePreview: PlatformId =
    previewTab ?? selected[0] ?? connectable[0]?.id ?? platforms[0]?.id ?? "instagram";
  // The preview must show the REAL account, never an invented one — TikTok's
  // audit checks that the creator sees their own username before posting, and a
  // hardcoded "@vidcica" would misrepresent every other platform too. For TikTok
  // the freshly queried creator handle wins over the stored one; otherwise fall
  // back to an obviously generic placeholder rather than a plausible handle.
  const storedHandle = platforms.find((p) => p.id === activePreview)?.handle;
  const activeHandle =
    activePreview === "tiktok" && tiktokCreator?.username
      ? `@${tiktokCreator.username}`
      : (storedHandle ?? t("publish.previewHandleFallback"));

  // The caption is edited for whichever selected platform is being previewed
  // (falling back to the first selected). Each platform keeps its own override;
  // an untouched platform shows — and sends — the derived default.
  const editTarget: PlatformId | null = selected.includes(activePreview)
    ? activePreview
    : (selected[0] ?? null);
  const editBody = editTarget ? (captions[editTarget] ?? defaultCaption) : defaultCaption;
  const previewCaption = captions[activePreview] ?? defaultCaption;
  const editTargetLabel = editTarget
    ? (platforms.find((p) => p.id === editTarget)?.label ?? editTarget)
    : "";

  // YouTube classifies Shorts from the FILE (vertical + <=3min); the Data API
  // has no flag for it. Offering the choice on a 16:9 video promises something
  // we can't deliver, so gate it and force the store back to "video".
  const shortEligible = canBeYouTubeShort(video);
  useEffect(() => {
    if (!shortEligible && asShort) setShort(false);
  }, [shortEligible, asShort, setShort]);

  const youtubeSelected = selected.includes("youtube");
  const tiktokSelected = selected.includes("tiktok");

  // ---- Confirmation view ----
  if (phase === "done") {
    // Only platforms that actually got a job can make progress. A skipped one
    // has no publish_jobs row, so tracking it would show "Pending" forever —
    // which is exactly how a blocked republish used to read as a hung publish.
    const queued = selected.filter((p) => !skipped.includes(p));
    const nothingQueued = queued.length === 0;
    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-md flex-col items-center gap-8 py-10"
        data-testid="publish-status"
      >
        <div className="flex flex-col items-center gap-5">
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 15 }}
            className={cn(
              "flex size-16 items-center justify-center rounded-full",
              nothingQueued
                ? "bg-secondary text-muted-foreground"
                : "bg-success-subtle text-success",
            )}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {nothingQueued ? (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8h.01M11 12h1v4h1" />
                </>
              ) : mode === "schedule" ? (
                <>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
                </>
              ) : (
                <path d="M20 6 9 17l-5-5" />
              )}
            </svg>
          </m.div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-semibold">
              {nothingQueued
                ? t("publish.doneNothingTitle")
                : mode === "schedule"
                  ? t("publish.doneScheduledTitle")
                  : t("publish.doneLaunchedTitle")}
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              {nothingQueued
                ? t("publish.doneNothingDesc")
                : mode === "schedule"
                  ? t("publish.doneScheduledDesc")
                  : t("publish.doneLaunchedDesc")}
            </p>
          </div>
        </div>

        {queued.length > 0 ? (
          <ul className="flex w-full flex-col gap-2">
            {queued.map((p) => {
              const s = statusView(statuses[p], t);
              const meta = platforms.find((x) => x.id === p);
              return (
                <li key={p} className="bg-card flex items-center gap-3 rounded-md px-4 py-3">
                  <PlatformIcon platform={p} size={32} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                    {meta?.label ?? p}
                  </span>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </li>
              );
            })}
          </ul>
        ) : null}

        {skipped.length > 0 ? (
          <p className="text-muted-foreground text-center text-[13px] leading-relaxed">
            {t("publish.skippedLabel")}{" "}
            {skipped.map((s) => platforms.find((p) => p.id === s)?.label ?? s).join(", ")}
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-2">
          <Link href={`/videos/${video.id}`} className={buttonVariants({ size: "lg" })}>
            {t("publish.viewVideo")}
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            {t("publish.backToDashboard")}
          </Link>
        </div>
      </m.div>
    );
  }

  // ---- Composer view ----
  const allSelected = connectable.every((p) => selected.includes(p.id));
  return (
    <div
      className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_340px]"
      data-testid="publish-flow"
    >
      {/* Controls */}
      <div className="flex min-w-0 flex-col gap-10">
        {/* Networks */}
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <SectionHeading
              title={t("publish.networksTitle")}
              subtitle={t("publish.networksSubtitle")}
            />
            {connectable.length > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                className="-mr-2 shrink-0"
                onClick={() => {
                  const allOn = connectable.every((p) => selected.includes(p.id));
                  connectable.forEach((p) => {
                    const on = selected.includes(p.id);
                    if (allOn && on) toggle(p.id);
                    if (!allOn && !on) toggle(p.id);
                  });
                }}
              >
                {allSelected ? t("publish.deselectAll") : t("publish.selectAll")}
              </Button>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2">
            {platforms.map((p) => (
              <PlatformRow
                key={p.id}
                platform={p}
                selected={selected.includes(p.id)}
                onToggle={() => toggle(p.id)}
                onPreview={() => setPreviewTab(p.id)}
              />
            ))}
          </ul>
        </section>

        {/* Caption editor — per-platform override, folded with hashtags at confirm */}
        {connectable.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <SectionHeading
                title={t("publish.captionEditorTitle")}
                subtitle={
                  editTarget
                    ? t("publish.captionEditorSubtitle", { platform: editTargetLabel })
                    : t("publish.captionSelectToEdit")
                }
              />
              {editTarget ? <PlatformIcon platform={editTarget} size={28} /> : null}
            </div>
            <Textarea
              value={editBody}
              disabled={!editTarget}
              onChange={(e) => editTarget && setCaption(editTarget, e.target.value)}
              rows={5}
              className="min-h-36"
              data-testid="publish-caption"
              aria-label={t("publish.captionEditorTitle")}
            />
            {editTarget ? (
              <div className="-mt-1 -ml-2 flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCaption(editTarget, defaultCaption)}
                  disabled={editBody === defaultCaption}
                >
                  {t("publish.captionReset")}
                </Button>
                {selected.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selected.forEach((p) => setCaption(p, editBody))}
                  >
                    {t("publish.captionApplyAll")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* YouTube format */}
        {youtubeSelected ? (
          <section className="flex flex-col gap-4">
            <SectionHeading
              title={t("publish.youtubeFormatTitle")}
              subtitle={t("publish.youtubeFormatSubtitle")}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <FormatOption
                title={t("publish.formatShortTitle")}
                hint={t("publish.formatShortHint")}
                selected={asShort && shortEligible}
                disabled={!shortEligible}
                onClick={() => setShort(true)}
              />
              <FormatOption
                title={t("publish.formatVideoTitle")}
                hint={t("publish.formatVideoHint")}
                selected={!asShort}
                onClick={() => setShort(false)}
              />
            </div>
            {!shortEligible ? (
              <p
                className="text-muted-foreground text-[13px] leading-relaxed"
                data-testid="short-ineligible"
              >
                {t("publish.formatShortIneligible", { format: video.format })}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* TikTok — privacy, interactions and commercial disclosure. Mandatory
            pre-post UI required by TikTok's Content Posting API audit. */}
        {tiktokSelected ? <TikTokOptions /> : null}

        {/* Timing */}
        <section className="flex flex-col gap-4">
          <SectionHeading title={t("publish.timingTitle")} subtitle={t("publish.timingSubtitle")} />
          <div className="flex flex-wrap gap-2">
            <TimingOption
              title={t("publish.timingNowTitle")}
              icon="send"
              selected={mode === "now"}
              onClick={() => setMode("now")}
            />
            <TimingOption
              title={t("publish.timingScheduleTitle")}
              icon="calendar"
              selected={mode === "schedule"}
              onClick={() => setMode("schedule")}
            />
          </div>
          {mode === "schedule" ? (
            <Input
              type="datetime-local"
              aria-label={t("publish.scheduleAriaLabel")}
              className="sm:max-w-xs"
              data-testid="publish-schedule"
              onChange={(e) => {
                const v = e.target.value;
                if (v) setScheduledAt(new Date(v).toISOString());
              }}
            />
          ) : null}
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            {mode === "now"
              ? t("publish.timingNowHint")
              : scheduledAt
                ? new Date(scheduledAt).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : t("publish.timingScheduleHint")}
          </p>
        </section>

        {/* Closing action row — the one filled action of the screen. */}
        <div className="bg-background sticky bottom-0 z-10 -mt-4 flex flex-col gap-3 py-4">
          {phase === "error" && error ? (
            <p role="alert" className="text-destructive text-[13px] leading-relaxed">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => void confirm()}
              disabled={!canConfirm()}
              data-testid="publish-confirm"
            >
              {phase === "submitting"
                ? t("publish.submitting")
                : selected.length === 0
                  ? t("publish.selectANetwork")
                  : mode === "schedule"
                    ? t("publish.schedulePublish")
                    : `${t("publish.publishNow")}${selected.length > 1 ? ` (${selected.length})` : ""}`}
            </Button>
            <Link
              href={`/videos/${video.id}`}
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              {t("common.cancel")}
            </Link>
          </div>
        </div>
      </div>

      {/* Preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label={t("publish.previewLabel")}>
        <div className="bg-card flex flex-col gap-5 rounded-lg p-5">
          {/* Video summary */}
          <div className="flex items-center gap-3">
            <div className="bg-secondary aspect-[9/16] w-11 shrink-0 overflow-hidden rounded-sm">
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Supabase thumb
                <img src={video.thumbnailUrl} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{video.title}</p>
              <p className="text-muted-foreground text-[13px]">
                {video.format} · {Math.round(video.durationSec)} s
              </p>
            </div>
          </div>

          {/* Preview platform tabs */}
          <div className="flex flex-wrap gap-1.5">
            {(selected.length > 0
              ? platforms.filter((p) => selected.includes(p.id))
              : connectable.length > 0
                ? connectable
                : platforms
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreviewTab(p.id)}
                aria-pressed={activePreview === p.id}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full pr-3.5 pl-2.5 text-[13px] font-semibold transition-colors",
                  FOCUS_RING,
                  activePreview === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-subtle-foreground hover:bg-accent",
                )}
              >
                <PlatformIcon platform={p.id} size={16} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Native card preview */}
          <NativeCardPreview
            platform={activePreview}
            handle={activeHandle}
            caption={previewCaption}
            hashtags={video.hashtags}
            thumbnailUrl={video.thumbnailUrl}
            asShort={asShort}
          />

          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("publish.captionNote")}
          </p>
        </div>
      </aside>
    </div>
  );
}

// ---- sub-components ----

/** Neutral focus ring for the custom (non-primitive) interactive elements. */
const FOCUS_RING =
  "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

/** A selectable pale tile: one tone step when chosen — never a coloured edge. */
function tileClass(selected: boolean) {
  return cn(
    "flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition-colors",
    FOCUS_RING,
    selected ? "bg-accent" : "bg-card hover:bg-accent",
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground text-[13px] leading-relaxed">{subtitle}</p>
    </div>
  );
}

/** The selection signal: an ink disc with a check when on, a pale disc when off. */
function CheckDisc({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-secondary",
      )}
    >
      {selected ? (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
    </span>
  );
}

const STATUS_HINT: Record<NetworkStatus, MessageKey | null> = {
  connected: null,
  needs_reconnect: "publish.reasonAuthExpired",
  disconnected: "publish.statusDisconnected",
  unavailable: "publish.statusUnavailable",
};

function PlatformRow({
  platform,
  selected,
  onToggle,
  onPreview,
}: {
  platform: PublishablePlatform;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const t = useT();
  const connected = platform.status === "connected";

  if (connected) {
    return (
      <li>
        <button
          type="button"
          onClick={() => {
            onToggle();
            onPreview();
          }}
          data-testid={`publish-pick-${platform.id}`}
          aria-pressed={selected}
          className={tileClass(selected)}
        >
          <PlatformIcon platform={platform.id} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">{platform.label}</p>
            <p className="text-muted-foreground truncate text-[13px]">
              {platform.handle ? platform.handle : t("publish.connected")}
            </p>
          </div>
          <CheckDisc selected={selected} />
        </button>
      </li>
    );
  }

  // Disconnected / needs-reconnect / unavailable — not selectable.
  const unavailable = platform.status === "unavailable";
  return (
    <li
      className="bg-card flex items-center gap-3 rounded-md px-4 py-3"
      data-testid={`publish-pick-${platform.id}`}
    >
      <PlatformIcon platform={platform.id} size={36} muted />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[15px] font-semibold">{platform.label}</p>
        <p className="text-muted-foreground text-[13px]">
          {STATUS_HINT[platform.status] ? t(STATUS_HINT[platform.status]!) : ""}
        </p>
      </div>
      {unavailable ? (
        <span className="text-muted-foreground text-[13px]">{t("publish.soon")}</span>
      ) : (
        <Link
          href="/networks"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
          data-testid={`connect-${platform.id}`}
        >
          {platform.status === "needs_reconnect" ? t("common.reconnect") : t("common.connect")}
        </Link>
      )}
    </li>
  );
}

function FormatOption({
  title,
  hint,
  selected,
  onClick,
  disabled = false,
}: {
  title: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(tileClass(selected), disabled && "hover:bg-card cursor-not-allowed opacity-50")}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-muted-foreground text-[13px]">{hint}</span>
      </span>
      <CheckDisc selected={selected} />
    </button>
  );
}

/** Timing choice — a pale pill; the chosen one turns ink (selected chip). */
function TimingOption({
  title,
  icon,
  selected,
  onClick,
}: {
  title: string;
  icon: "send" | "calendar";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
        FOCUS_RING,
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-foreground hover:bg-accent",
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {icon === "send" ? (
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
        ) : (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </>
        )}
      </svg>
      {title}
    </button>
  );
}
