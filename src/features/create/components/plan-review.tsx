"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/provider";
import { useCreateStore } from "../provider";
import { BlockedNotice } from "./blocked-notice";

export function PlanReview() {
  const t = useT();
  const plan = useCreateStore((s) => s.plan);
  const phase = useCreateStore((s) => s.phase);
  const blockedReason = useCreateStore((s) => s.blockedReason);
  const planBlock = useCreateStore((s) => s.planBlock);
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

      {phase === "blocked" && blockedReason ? (
        <BlockedNotice reason={blockedReason} block={planBlock} />
      ) : null}

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
