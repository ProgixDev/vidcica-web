"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { PlatformMeta, PlatformId } from "@/lib/vidcica/network";
import {
  usePublishJobsRealtime,
  type PublishJobView,
} from "@/lib/vidcica/use-publish-jobs-realtime";
import { usePublishStore } from "../provider";

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

export function PublishFlow({ userId, available }: { userId: string; available: PlatformMeta[] }) {
  const videoId = usePublishStore((s) => s.videoId);
  const selected = usePublishStore((s) => s.selected);
  const mode = usePublishStore((s) => s.mode);
  const asShort = usePublishStore((s) => s.youtubeAsShort);
  const phase = usePublishStore((s) => s.phase);
  const error = usePublishStore((s) => s.error);
  const skipped = usePublishStore((s) => s.skipped);
  const toggle = usePublishStore((s) => s.togglePlatform);
  const setMode = usePublishStore((s) => s.setMode);
  const setScheduledAt = usePublishStore((s) => s.setScheduledAt);
  const setShort = usePublishStore((s) => s.setYoutubeAsShort);
  const canConfirm = usePublishStore((s) => s.canConfirm);
  const confirm = usePublishStore((s) => s.confirm);

  const statuses = usePublishJobsRealtime(userId, videoId);

  if (available.length === 0) {
    return (
      <EmptyState
        className="py-16"
        title="Aucun réseau connecté"
        description="Connectez au moins un compte pour publier cette vidéo."
        action={
          <Link href="/networks" className={buttonVariants()}>
            Connecter un réseau
          </Link>
        }
      />
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-4" data-testid="publish-status">
        <h2 className="text-base font-semibold">
          {mode === "schedule" ? "Publication programmée" : "Publication lancée"}
        </h2>
        <ul className="flex flex-col gap-2">
          {selected.map((p) => {
            const s = statusView(statuses[p]);
            return (
              <li
                key={p}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span className="capitalize">{p}</span>
                <Badge variant={s.variant}>{s.label}</Badge>
              </li>
            );
          })}
        </ul>
        {skipped.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            Ignoré (déjà publié ou en cours) : {skipped.join(", ")}
          </p>
        ) : null}
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }), "self-start")}
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const youtubeSelected = selected.includes("youtube" as PlatformId);

  return (
    <div className="flex flex-col gap-6" data-testid="publish-flow">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Réseaux</legend>
        {available.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
            data-testid={`publish-pick-${p.id}`}
          >
            <input
              type="checkbox"
              className="accent-primary size-4"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      {youtubeSelected ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={asShort}
            onChange={(e) => setShort(e.target.checked)}
          />
          Publier sur YouTube en tant que Short
        </label>
      ) : null}

      <div className="flex flex-col gap-2">
        <div role="tablist" className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1">
          {(["now", "schedule"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                mode === m ? "bg-background text-foreground shadow-xs" : "text-muted-foreground",
              )}
            >
              {m === "now" ? "Maintenant" : "Programmer"}
            </button>
          ))}
        </div>
        {mode === "schedule" ? (
          <input
            type="datetime-local"
            className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
            data-testid="publish-schedule"
            onChange={(e) => {
              const v = e.target.value;
              if (v) setScheduledAt(new Date(v).toISOString());
            }}
          />
        ) : null}
      </div>

      {phase === "error" && error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <Button onClick={() => void confirm()} disabled={!canConfirm()} data-testid="publish-confirm">
        {phase === "submitting"
          ? "Envoi…"
          : mode === "schedule"
            ? "Programmer la publication"
            : "Publier maintenant"}
      </Button>
    </div>
  );
}
