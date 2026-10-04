"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import type { EnqueueGenerationFailReason } from "@/lib/vidcica/generation";
import { useCreateStore } from "../provider";

/** Blocked reason → plain-language message + the right recovery (AC-11). */
function BlockedNotice({ reason }: { reason: EnqueueGenerationFailReason }) {
  const t = useT();
  const billing = { labelKey: "create.viewPlans" as MessageKey, href: "/billing" };
  const map: Record<EnqueueGenerationFailReason, { msgKey: MessageKey; action?: typeof billing }> =
    {
      insufficient_credits: { msgKey: "create.blockInsufficientCredits", action: billing },
      model_locked: { msgKey: "create.blockModelLocked", action: billing },
      daily_cap: { msgKey: "create.blockDailyCap" },
      not_live: { msgKey: "create.blockNotLive" },
      disabled: { msgKey: "create.blockDisabled" },
      in_progress: { msgKey: "create.blockInProgress" },
      no_plan: { msgKey: "create.blockNoPlan" },
      image_not_supported: { msgKey: "create.blockImageNotSupported" },
      script_too_long: { msgKey: "create.blockScriptTooLong" },
      content_blocked: { msgKey: "create.blockContentBlocked" },
      unauthenticated: { msgKey: "create.blockUnauthenticated" },
      error: { msgKey: "create.blockError" },
    };
  const { msgKey, action } = map[reason];
  return (
    <div role="alert" className="bg-destructive-subtle flex flex-col gap-4 rounded-lg p-5">
      <p className="text-destructive text-[15px] leading-relaxed font-medium">{t(msgKey)}</p>
      {action ? (
        <Link
          href={action.href}
          className={buttonVariants({ variant: "default", className: "self-start" })}
        >
          {t(action.labelKey)}
        </Link>
      ) : null}
    </div>
  );
}

export function PlanReview() {
  const t = useT();
  const plan = useCreateStore((s) => s.plan);
  const phase = useCreateStore((s) => s.phase);
  const blockedReason = useCreateStore((s) => s.blockedReason);
  const confirmEnqueue = useCreateStore((s) => s.confirmEnqueue);
  const backToEdit = useCreateStore((s) => s.backToEdit);

  if (!plan) return null;
  const enqueuing = phase === "enqueuing";

  return (
    <div className="flex w-full flex-col gap-6" data-testid="plan-review">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{plan.title}</h2>
        <p className="text-muted-foreground max-w-2xl text-[15px] leading-relaxed">
          {plan.description}
        </p>
        {plan.hashtags.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.hashtags.map((h) => (
              <Badge key={h} variant="muted">
                {h}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <ol className="bg-card divide-border flex flex-col divide-y rounded-lg px-6 py-2">
        {plan.segments.map((seg) => (
          <li key={seg.index} className="flex items-baseline gap-4 py-4">
            <span className="text-muted-foreground shrink-0 text-[13px] tabular-nums">
              {String(seg.index + 1).padStart(2, "0")}
            </span>
            <span className="text-[15px] leading-relaxed">{seg.narration_fr}</span>
          </li>
        ))}
      </ol>

      {phase === "blocked" && blockedReason ? <BlockedNotice reason={blockedReason} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void confirmEnqueue()}
          disabled={enqueuing}
          data-testid="enqueue-btn"
        >
          {enqueuing ? t("create.enqueuing") : t("create.enqueue")}
        </Button>
        <Button variant="ghost" onClick={backToEdit} disabled={enqueuing}>
          {t("common.edit")}
        </Button>
      </div>
    </div>
  );
}
