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
      unauthenticated: { msgKey: "create.blockUnauthenticated" },
      error: { msgKey: "create.blockError" },
    };
  const { msgKey, action } = map[reason];
  return (
    <div role="alert" className="border-destructive/40 flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-sm">{t(msgKey)}</p>
      {action ? (
        <Link href={action.href} className={buttonVariants({ variant: "default" })}>
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
    <div className="flex w-full flex-col gap-5" data-testid="plan-review">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">{plan.title}</h2>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
        {plan.hashtags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {plan.hashtags.map((h) => (
              <Badge key={h} variant="outline">
                {h}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <ol className="flex flex-col gap-2">
        {plan.segments.map((seg) => (
          <li key={seg.index} className="bg-card flex gap-3 rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground shrink-0 font-mono text-xs">
              {String(seg.index + 1).padStart(2, "0")}
            </span>
            <span>{seg.narration_fr}</span>
          </li>
        ))}
      </ol>

      {phase === "blocked" && blockedReason ? <BlockedNotice reason={blockedReason} /> : null}

      <div className="flex flex-wrap gap-3">
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
