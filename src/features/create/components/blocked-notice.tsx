"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey, TFunction } from "@/lib/i18n";
import type { EnqueueGenerationFailReason, PlanBlock } from "@/lib/vidcica/generation";
import { TIERS, type Plan } from "@/lib/vidcica/tiers";
import { formatMegabytes, formatVideoLength } from "@/lib/vidcica/units";

type Action = { label: string; href: string; testId: string };

/** Messages without a plan detail: the server's own words for each reason. */
const PLAIN: Record<EnqueueGenerationFailReason, MessageKey> = {
  insufficient_credits: "create.blockInsufficientCredits",
  model_locked: "create.blockModelLocked",
  duration_locked: "create.blockDurationLockedShort",
  voice_locked: "create.blockVoiceLockedShort",
  library_full: "create.blockLibraryFullShort",
  storage_full: "create.blockStorageFullShort",
  daily_cap: "create.blockDailyCap",
  not_live: "create.blockNotLive",
  disabled: "create.blockDisabled",
  in_progress: "create.blockInProgress",
  no_plan: "create.blockNoPlan",
  image_not_supported: "create.blockImageNotSupported",
  script_too_long: "create.blockScriptTooLongShort",
  content_blocked: "create.blockContentBlocked",
  unauthenticated: "create.blockUnauthenticated",
  error: "create.blockError",
};

/** The message for a refusal, naming the plan and its limit when the server sent them. */
function message(reason: EnqueueGenerationFailReason, block: PlanBlock | null, t: TFunction) {
  const label = (p: Plan) => t(TIERS[p].labelKey);
  const plan = block?.plan ?? null;
  const required = block?.requiredPlan ?? null;
  const limit = block?.limit;
  switch (reason) {
    case "duration_locked":
      if (plan && limit !== undefined) {
        return t("create.blockDurationLocked", {
          plan: label(plan),
          limit: formatVideoLength(limit, t),
        });
      }
      break;
    case "voice_locked":
      if (required) return t("create.blockVoiceLocked", { plan: label(required) });
      break;
    case "library_full":
      if (plan && limit !== undefined) {
        return t("create.blockLibraryFull", { plan: label(plan), limit });
      }
      break;
    case "storage_full":
      if (plan && limit !== undefined) {
        return t("create.blockStorageFull", {
          plan: label(plan),
          limit: formatMegabytes(limit, t),
        });
      }
      break;
    case "model_locked":
      if (required) return t("create.blockModelLockedPlan", { plan: label(required) });
      break;
    // The voice runs longer than the plan's longest video (the server says which).
    case "script_too_long":
      if (limit !== undefined) {
        return t("create.blockScriptTooLong", { max: formatVideoLength(limit, t) });
      }
      break;
  }
  return t(PLAIN[reason]);
}

/** The ways out of a refusal: the plan that unlocks it, packs, or the library. */
function actions(
  reason: EnqueueGenerationFailReason,
  block: PlanBlock | null,
  t: TFunction,
): Action[] {
  // « Passer à l’offre … » names the plan that unlocks the request when the
  // server sent it; otherwise the plans page.
  const upgrade: Action = block?.requiredPlan
    ? {
        label: t("create.upgradeTo", { plan: t(TIERS[block.requiredPlan].labelKey) }),
        href: "/billing",
        testId: "blocked-upgrade",
      }
    : { label: t("create.viewPlans"), href: "/billing", testId: "blocked-upgrade" };
  switch (reason) {
    // Not enough credits: a pack is the quickest fix, so land on them.
    case "insufficient_credits":
      return [{ label: t("create.buyCredits"), href: "/billing#packs", testId: "blocked-packs" }];
    case "model_locked":
    case "duration_locked":
    case "voice_locked":
      return [upgrade];
    // A full library or storage: delete videos, or move to a bigger plan.
    case "library_full":
    case "storage_full":
      return [
        upgrade,
        { label: t("create.seeMyVideos"), href: "/videos", testId: "blocked-videos" },
      ];
    default:
      return [];
  }
}

/** A refused request in plain language, with the right way out (spec AC-11, brief B4). */
export function BlockedNotice({
  reason,
  block,
}: {
  reason: EnqueueGenerationFailReason;
  block: PlanBlock | null;
}) {
  const t = useT();
  const ways = actions(reason, block, t);
  return (
    <div
      role="alert"
      className="bg-destructive-subtle flex flex-col gap-4 rounded-lg p-5"
      data-testid="blocked-notice"
    >
      <p className="text-destructive text-[15px] leading-relaxed font-medium">
        {message(reason, block, t)}
      </p>
      {ways.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {ways.map((a, i) => (
            <Link
              key={a.testId}
              href={a.href}
              data-testid={a.testId}
              className={buttonVariants({ variant: i === 0 ? "default" : "ghost" })}
            >
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
