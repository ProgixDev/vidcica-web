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
    <section className="flex flex-col gap-4" data-testid="tiktok-options">
      <div className="flex items-center gap-3">
        <PlatformIcon platform="tiktok" size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-xl font-semibold">{t("tiktok.sectionTitle")}</h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            {t("tiktok.sectionSubtitle")}
          </p>
        </div>
      </div>

      {state === "loading" ? (
        <div
          className="bg-card flex items-center gap-3 rounded-md px-4 py-3"
          data-testid="tiktok-creator-loading"
        >
          <div className="bg-muted size-10 animate-pulse rounded-full" />
          <div className="bg-muted h-3.5 w-32 animate-pulse rounded-full" />
        </div>
      ) : state === "needs_reconnect" || state === "error" ? (
        <div className="bg-card flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md px-4 py-3">
          <p
            role="alert"
            className="text-muted-foreground min-w-0 flex-1 text-[13px] leading-relaxed"
          >
            {state === "needs_reconnect" ? t("tiktok.needsReconnect") : t("tiktok.loadFailed")}
          </p>
          <Link href="/networks" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            {t("common.reconnect")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Creator identity — TikTok requires the real handle + avatar here. */}
          <div className="bg-card flex items-center gap-3 rounded-md px-4 py-3">
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
              <p className="truncate text-[15px] font-semibold" data-testid="tiktok-username">
                {creator?.nickname || creator?.username}
              </p>
              {creator?.username ? (
                <p className="text-muted-foreground truncate text-[13px]">@{creator.username}</p>
              ) : null}
            </div>
          </div>

          {/* Privacy — no pre-selection; TikTok wants a deliberate choice. */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 text-[15px] font-semibold">{t("tiktok.privacyTitle")}</legend>
            {(creator?.privacyOptions ?? []).map((level) => (
              <label
                key={level}
                className={cn(
                  "has-focus-visible:ring-ring has-focus-visible:ring-offset-background flex cursor-pointer items-center gap-3 rounded-md px-4 py-3.5 text-[15px] transition-colors has-focus-visible:ring-2 has-focus-visible:ring-offset-2",
                  o.privacyLevel === level ? "bg-accent" : "bg-card hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name="tiktok-privacy"
                  className="accent-primary size-4 outline-none"
                  checked={o.privacyLevel === level}
                  onChange={() => setOptions({ privacyLevel: level })}
                  data-testid={`tiktok-privacy-${level}`}
                />
                <span className="font-medium">{t(PRIVACY_KEY[level])}</span>
              </label>
            ))}
            {(creator?.privacyOptions ?? []).length === 0 ? (
              <p className="text-muted-foreground text-[13px]">{t("tiktok.noPrivacyOptions")}</p>
            ) : null}
          </fieldset>

          {/* Interaction settings — an account-disabled one stays locked on. */}
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-semibold">{t("tiktok.interactionsTitle")}</p>
            <div className="bg-card flex flex-col rounded-md py-1.5">
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
          </div>

          {/* Commercial-content disclosure. */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-semibold">{t("tiktok.disclosureTitle")}</p>
              <p className="text-muted-foreground text-[13px] leading-relaxed">
                {t("tiktok.disclosureHelp")}
              </p>
            </div>
            <div className="bg-card flex flex-col rounded-md py-1.5">
              <label className="flex min-h-12 items-center gap-3 px-4 py-2 text-[15px]">
                <span className="flex-1">{t("tiktok.yourBrand")}</span>
                <Switch
                  checked={o.brandOrganicToggle}
                  onChange={(v) => setOptions({ brandOrganicToggle: v })}
                  aria-label={t("tiktok.yourBrand")}
                />
              </label>
              <label className="flex min-h-12 items-center gap-3 px-4 py-2 text-[15px]">
                <span className="flex-1">{t("tiktok.brandedContent")}</span>
                <Switch
                  checked={o.brandContentToggle}
                  onChange={(v) => setOptions({ brandContentToggle: v })}
                  aria-label={t("tiktok.brandedContent")}
                />
              </label>
            </div>
            {o.brandOrganicToggle || o.brandContentToggle ? (
              <p
                className="text-muted-foreground text-[13px] leading-relaxed"
                data-testid="tiktok-label-preview"
              >
                {t("tiktok.labelPreview", {
                  label: o.brandContentToggle
                    ? t("tiktok.labelPaidPartnership")
                    : t("tiktok.labelPromotional"),
                })}
              </p>
            ) : null}
          </div>

          {block ? (
            <p
              role="alert"
              className="text-destructive text-[13px] leading-relaxed"
              data-testid="tiktok-block"
            >
              {t(BLOCK_KEY[block], {
                max: String(creator?.maxVideoPostDurationSec ?? 0),
              })}
            </p>
          ) : null}

          <p className="text-muted-foreground text-xs leading-relaxed">{t("tiktok.consent")}</p>
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
    <label className="flex min-h-12 items-center gap-3 px-4 py-2 text-[15px]">
      <span className={cn("flex min-w-0 flex-1 flex-col", locked && "text-muted-foreground")}>
        {label}
        {locked ? <span className="text-muted-foreground text-xs">{lockedLabel}</span> : null}
      </span>
      <Switch
        checked={locked ? false : allowed}
        disabled={locked}
        onChange={(v) => !locked && onChange(v)}
        aria-label={label}
        data-testid={testId}
      />
    </label>
  );
}
