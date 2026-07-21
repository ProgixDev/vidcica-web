"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { m } from "@/components/motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import type { NetworkStatus, PlatformId } from "@/lib/vidcica/network";
import {
  usePublishJobsRealtime,
  type PublishJobView,
} from "@/lib/vidcica/use-publish-jobs-realtime";
import { usePublishStore } from "../provider";
import { NativeCardPreview } from "./native-card-preview";

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

const REASON_LABEL: Record<string, string> = {
  auth_expired: "Reconnexion requise",
  encoding: "Vidéo non prête",
  rate_limited: "Limite atteinte",
  rejected: "Refusé par la plateforme",
  unknown: "Échec",
};

function statusView(v: PublishJobView | undefined): {
  label: string;
  variant: "muted" | "brand" | "success" | "warning";
} {
  if (!v) return { label: "En attente", variant: "muted" };
  if (v.status === "succeeded") return { label: "Publié", variant: "success" };
  if (v.status === "failed")
    return { label: REASON_LABEL[v.reason ?? "unknown"] ?? "Échec", variant: "warning" };
  return { label: "Publication…", variant: "brand" };
}

/** Caption the backend will actually build (title + description). Hashtags are
 *  rendered separately in the preview. */
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
  const canConfirm = usePublishStore((s) => s.canConfirm);
  const confirm = usePublishStore((s) => s.confirm);

  const statuses = usePublishJobsRealtime(userId, videoId);
  const connectable = platforms.filter((p) => p.status === "connected");
  const caption = useMemo(() => buildCaption(video), [video]);

  // The platform shown in the right-hand preview. Defaults to the first
  // selected one, else the first connected one, else the first platform.
  const [previewTab, setPreviewTab] = useState<PlatformId | null>(null);
  const activePreview: PlatformId =
    previewTab ?? selected[0] ?? connectable[0]?.id ?? platforms[0]?.id ?? "instagram";
  const activeHandle = platforms.find((p) => p.id === activePreview)?.handle ?? "@vidcica";

  const youtubeSelected = selected.includes("youtube");

  // ---- Confirmation view ----
  if (phase === "done") {
    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-6"
        data-testid="publish-status"
      >
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15 }}
          className="bg-success text-success-foreground flex size-20 items-center justify-center rounded-full shadow-lg"
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {mode === "schedule" ? (
              <>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
              </>
            ) : (
              <path d="M20 6 9 17l-5-5" />
            )}
          </svg>
        </m.div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            {mode === "schedule" ? "Publication programmée" : "Publication lancée"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {mode === "schedule"
              ? "Vos vidéos partiront à l’heure prévue."
              : "Suivez l’avancement réseau par réseau ci-dessous."}
          </p>
        </div>

        <ul className="flex w-full flex-col gap-2">
          {selected.map((p) => {
            const s = statusView(statuses[p]);
            const meta = platforms.find((x) => x.id === p);
            return (
              <li key={p} className="bg-card flex items-center gap-3 rounded-xl border p-3 text-sm">
                <PlatformIcon platform={p} size={28} />
                <span className="flex-1 font-medium">{meta?.label ?? p}</span>
                <Badge variant={s.variant}>{s.label}</Badge>
              </li>
            );
          })}
        </ul>

        {skipped.length > 0 ? (
          <p className="text-muted-foreground text-center text-xs">
            Ignoré (déjà publié ou en cours) :{" "}
            {skipped.map((s) => platforms.find((p) => p.id === s)?.label ?? s).join(", ")}
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-2">
          <Link href={`/videos/${video.id}`} className={buttonVariants()}>
            Voir la vidéo
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour au tableau de bord
          </Link>
        </div>
      </m.div>
    );
  }

  // ---- Composer view ----
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" data-testid="publish-flow">
      {/* Controls */}
      <div className="flex flex-col gap-5">
        {/* Networks */}
        <section className="bg-card rounded-2xl border p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Réseaux</h2>
              <p className="text-muted-foreground text-xs">Choisissez où diffuser cette vidéo.</p>
            </div>
            {connectable.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  const allOn = connectable.every((p) => selected.includes(p.id));
                  connectable.forEach((p) => {
                    const on = selected.includes(p.id);
                    if (allOn && on) toggle(p.id);
                    if (!allOn && !on) toggle(p.id);
                  });
                }}
                className="text-primary text-xs font-medium hover:underline"
              >
                {connectable.every((p) => selected.includes(p.id))
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
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

        {/* YouTube format */}
        {youtubeSelected ? (
          <section className="bg-card rounded-2xl border p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Format YouTube</h2>
            <p className="text-muted-foreground mb-3 text-xs">
              Publier en Short vertical ou en vidéo classique.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <FormatOption
                title="Short"
                hint="Vertical, format court"
                selected={asShort}
                onClick={() => setShort(true)}
              />
              <FormatOption
                title="Vidéo classique"
                hint="Publication standard"
                selected={!asShort}
                onClick={() => setShort(false)}
              />
            </div>
          </section>
        ) : null}

        {/* Timing */}
        <section className="bg-card rounded-2xl border p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Quand publier ?</h2>
          <p className="text-muted-foreground mb-3 text-xs">
            Diffusez maintenant ou programmez pour plus tard.
          </p>
          <div className="flex flex-col gap-2">
            <TimingOption
              title="Maintenant"
              hint="La vidéo part dès la confirmation."
              icon="send"
              selected={mode === "now"}
              onClick={() => setMode("now")}
            />
            <TimingOption
              title="Programmer"
              hint={
                mode === "schedule" && scheduledAt
                  ? new Date(scheduledAt).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Choisissez la date et l’heure."
              }
              icon="calendar"
              selected={mode === "schedule"}
              onClick={() => setMode("schedule")}
            />
            {mode === "schedule" ? (
              <input
                type="datetime-local"
                aria-label="Date de publication"
                className="border-input bg-background focus-visible:ring-ring mt-1 h-10 rounded-full border px-4 text-sm focus-visible:ring-2 focus-visible:outline-none"
                data-testid="publish-schedule"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setScheduledAt(new Date(v).toISOString());
                }}
              />
            ) : null}
          </div>
        </section>

        {phase === "error" && error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <Button
          size="lg"
          className="rounded-full"
          onClick={() => void confirm()}
          disabled={!canConfirm()}
          data-testid="publish-confirm"
        >
          {phase === "submitting"
            ? "Envoi…"
            : selected.length === 0
              ? "Sélectionnez un réseau"
              : mode === "schedule"
                ? "Programmer la publication"
                : `Publier maintenant${selected.length > 1 ? ` (${selected.length})` : ""}`}
        </Button>
      </div>

      {/* Preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-card flex flex-col gap-4 rounded-2xl border p-4">
          {/* Video summary */}
          <div className="flex items-center gap-3">
            <div className="bg-muted aspect-[9/16] w-12 shrink-0 overflow-hidden rounded-lg">
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Supabase thumb
                <img src={video.thumbnailUrl} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                Aperçu du post
              </p>
              <p className="truncate text-sm font-semibold">{video.title}</p>
              <p className="text-muted-foreground text-xs">
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
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  activePreview === p.id
                    ? "border-primary bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <PlatformIcon platform={p.id} size={14} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Native card preview */}
          <NativeCardPreview
            platform={activePreview}
            handle={activeHandle}
            caption={caption}
            hashtags={video.hashtags}
            thumbnailUrl={video.thumbnailUrl}
            asShort={asShort}
          />

          <p className="text-muted-foreground text-[11px] leading-relaxed">
            La légende provient du titre, de la description et des hashtags de la vidéo.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ---- sub-components ----

const STATUS_HINT: Record<NetworkStatus, string> = {
  connected: "",
  needs_reconnect: "Reconnexion requise",
  disconnected: "Non connecté",
  unavailable: "Bientôt disponible",
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
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
            selected ? "border-primary bg-accent/60" : "hover:bg-muted border-border",
          )}
        >
          <PlatformIcon platform={platform.id} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{platform.label}</p>
            {platform.handle ? (
              <p className="text-muted-foreground truncate text-xs">{platform.handle}</p>
            ) : (
              <p className="text-success text-xs font-medium">Connecté</p>
            )}
          </div>
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
            )}
          >
            {selected ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : null}
          </span>
        </button>
      </li>
    );
  }

  // Disconnected / needs-reconnect / unavailable — not selectable.
  const unavailable = platform.status === "unavailable";
  return (
    <li
      className="border-border flex items-center gap-3 rounded-xl border border-dashed p-3"
      data-testid={`publish-pick-${platform.id}`}
    >
      <PlatformIcon platform={platform.id} size={36} muted />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{platform.label}</p>
        <p className="text-muted-foreground text-xs">{STATUS_HINT[platform.status]}</p>
      </div>
      {unavailable ? (
        <span className="text-muted-foreground text-xs">Bientôt</span>
      ) : (
        <Link
          href="/networks"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          data-testid={`connect-${platform.id}`}
        >
          {platform.status === "needs_reconnect" ? "Reconnecter" : "Connecter"}
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
}: {
  title: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-accent/60" : "hover:bg-muted border-border",
      )}
    >
      <span className={cn("text-sm font-semibold", selected && "text-primary")}>{title}</span>
      <span className="text-muted-foreground text-[11px]">{hint}</span>
    </button>
  );
}

function TimingOption({
  title,
  hint,
  icon,
  selected,
  onClick,
}: {
  title: string;
  hint: string;
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
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-accent/60" : "hover:bg-muted border-border",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <svg
          width="18"
          height="18"
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
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{hint}</p>
      </div>
    </button>
  );
}
