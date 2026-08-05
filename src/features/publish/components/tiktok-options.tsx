"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { buttonVariants } from "@/components/ui/button";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import {
  fetchTikTokCreatorInfo,
  type TikTokBlockReason,
  type TikTokPrivacyLevel,
} from "@/lib/vidcica/tiktok";
import { usePublishStore } from "../provider";

const PRIVACY_KEY: Record<TikTokPrivacyLevel, MessageKey> = {
  PUBLIC_TO_EVERYONE: "tiktok.privacy.public",
  MUTUAL_FOLLOW_FRIENDS: "tiktok.privacy.friends",
  FOLLOWER_OF_CREATOR: "tiktok.privacy.followers",
  SELF_ONLY: "tiktok.privacy.private",
};

const BLOCK_KEY: Record<TikTokBlockReason, MessageKey> = {
  privacy_required: "tiktok.blockPrivacyRequired",
  branded_content_private: "tiktok.blockBrandedPrivate",
  too_long: "tiktok.blockTooLong",
};

/**
 * TikTok's mandatory pre-post panel. Rendered whenever TikTok is a selected
 * publish target.
 *
 * Every control here exists because TikTok's Content Posting API audit requires
 * it — this is not product polish, and removing any of it fails review:
 *   · the creator's real username + avatar, fetched fresh (never a placeholder);
 *   · a privacy level the creator explicitly picks, from the options their
 *     account actually allows (no default — TikTok wants a deliberate choice);
 *   · comment / duet / stitch controls that cannot re-enable what the account
 *     has turned off;
 *   · a commercial-content disclosure with the resulting label spelled out.
 * See lib/vidcica/tiktok.ts and supabase/functions/creator-info.
 */
export function TikTokOptions() {
  const t = useT();
  const o = usePublishStore((s) => s.tiktok);
  const creator = usePublishStore((s) => s.tiktokCreator);
  const setOptions = usePublishStore((s) => s.setTikTokOptions);
  const setCreator = usePublishStore((s) => s.setTikTokCreator);
  const blockReason = usePublishStore((s) => s.tiktokBlockReason);

  const [state, setState] = useState<"loading" | "ready" | "needs_reconnect" | "error">("loading");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    let live = true;
    void (async () => {
      const res = await fetchTikTokCreatorInfo(createClient(), controller.signal);
      if (!live || controller.signal.aborted) return;
      if (res.ok) {
        setCreator(res.creator);
        setState("ready");
      } else {
        setCreator(null);
        setState(res.reason === "needs_reconnect" ? "needs_reconnect" : "error");
      }
    })();
    return () => {
      live = false;
      controller.abort();
    };
  }, [setCreator]);

  const block = blockReason();

  return (
    <section className="bg-card rounded-2xl border p-4 sm:p-5" data-testid="tiktok-options">
      <div className="mb-4 flex items-start gap-3">
        <PlatformIcon platform="tiktok" size={36} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t("tiktok.sectionTitle")}</h2>
          <p className="text-muted-foreground text-xs">{t("tiktok.sectionSubtitle")}</p>
        </div>
      </div>

      {state === "loading" ? (
        <div className="flex items-center gap-3" data-testid="tiktok-creator-loading">
          <div className="bg-muted size-10 animate-pulse rounded-full" />
          <div className="bg-muted h-3.5 w-32 animate-pulse rounded-full" />
        </div>
      ) : state === "needs_reconnect" || state === "error" ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-muted-foreground text-xs">
            {state === "needs_reconnect" ? t("tiktok.needsReconnect") : t("tiktok.loadFailed")}
          </p>
          <Link
            href="/networks"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          >
            {t("common.reconnect")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Creator identity — TikTok requires the real handle + avatar here. */}
          <div className="bg-muted/40 flex items-center gap-3 rounded-xl p-3">
            {creator?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote TikTok CDN avatar
              <img
                src={creator.avatarUrl}
                alt=""
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="bg-muted size-10 shrink-0 rounded-full" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" data-testid="tiktok-username">
                {creator?.nickname || creator?.username}
              </p>
              {creator?.username ? (
                <p className="text-muted-foreground truncate text-xs">@{creator.username}</p>
              ) : null}
            </div>
          </div>

          {/* Privacy — no pre-selection; TikTok wants a deliberate choice. */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-semibold">{t("tiktok.privacyTitle")}</legend>
            {(creator?.privacyOptions ?? []).map((level) => (
              <label
                key={level}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                  o.privacyLevel === level ? "border-primary bg-accent/60" : "hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="tiktok-privacy"
                  className="accent-primary size-4"
                  checked={o.privacyLevel === level}
                  onChange={() => setOptions({ privacyLevel: level })}
                  data-testid={`tiktok-privacy-${level}`}
                />
                <span className="font-medium">{t(PRIVACY_KEY[level])}</span>
              </label>
            ))}
            {(creator?.privacyOptions ?? []).length === 0 ? (
              <p className="text-muted-foreground text-xs">{t("tiktok.noPrivacyOptions")}</p>
            ) : null}
          </fieldset>

          {/* Interaction settings — an account-disabled one stays locked on. */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold">{t("tiktok.interactionsTitle")}</p>
            <InteractionToggle
              label={t("tiktok.allowComments")}
              lockedLabel={t("tiktok.lockedByAccount")}
              locked={creator?.commentDisabled ?? false}
              allowed={!o.disableComment}
              onChange={(allow) => setOptions({ disableComment: !allow })}
              testId="tiktok-allow-comment"
            />
            <InteractionToggle
              label={t("tiktok.allowDuet")}
              lockedLabel={t("tiktok.lockedByAccount")}
              locked={creator?.duetDisabled ?? false}
              allowed={!o.disableDuet}
              onChange={(allow) => setOptions({ disableDuet: !allow })}
              testId="tiktok-allow-duet"
            />
            <InteractionToggle
              label={t("tiktok.allowStitch")}
              lockedLabel={t("tiktok.lockedByAccount")}
              locked={creator?.stitchDisabled ?? false}
              allowed={!o.disableStitch}
              onChange={(allow) => setOptions({ disableStitch: !allow })}
              testId="tiktok-allow-stitch"
            />
          </div>

          {/* Commercial-content disclosure. */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold">{t("tiktok.disclosureTitle")}</p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {t("tiktok.disclosureHelp")}
            </p>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={o.brandOrganicToggle}
                onChange={(v) => setOptions({ brandOrganicToggle: v })}
                aria-label={t("tiktok.yourBrand")}
              />
              <span className="flex-1">{t("tiktok.yourBrand")}</span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={o.brandContentToggle}
                onChange={(v) => setOptions({ brandContentToggle: v })}
                aria-label={t("tiktok.brandedContent")}
              />
              <span className="flex-1">{t("tiktok.brandedContent")}</span>
            </label>
            {o.brandOrganicToggle || o.brandContentToggle ? (
              <p className="text-muted-foreground text-[11px]" data-testid="tiktok-label-preview">
                {t("tiktok.labelPreview", {
                  label: o.brandContentToggle
                    ? t("tiktok.labelPaidPartnership")
                    : t("tiktok.labelPromotional"),
                })}
              </p>
            ) : null}
          </div>

          {block ? (
            <p role="alert" className="text-destructive text-xs" data-testid="tiktok-block">
              {t(BLOCK_KEY[block], {
                max: String(creator?.maxVideoPostDurationSec ?? 0),
              })}
            </p>
          ) : null}

          <p className="text-muted-foreground text-[11px] leading-relaxed">{t("tiktok.consent")}</p>
        </div>
      )}
    </section>
  );
}

/** A permission toggle whose "on" means ALLOWED. When the creator's TikTok
 *  account disables the interaction we render it off and non-interactive — the
 *  app must never be able to re-enable what the account turned off. */
function InteractionToggle({
  label,
  lockedLabel,
  locked,
  allowed,
  onChange,
  testId,
}: {
  label: string;
  lockedLabel: string;
  locked: boolean;
  allowed: boolean;
  onChange: (allow: boolean) => void;
  testId: string;
}) {
  return (
    <label className={cn("flex items-center gap-3 text-sm", locked && "opacity-60")}>
      <Switch
        checked={locked ? false : allowed}
        disabled={locked}
        onChange={(v) => !locked && onChange(v)}
        aria-label={label}
        data-testid={testId}
      />
      <span className="flex-1">{label}</span>
      {locked ? <span className="text-muted-foreground text-[11px]">{lockedLabel}</span> : null}
    </label>
  );
}
