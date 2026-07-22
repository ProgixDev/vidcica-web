"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { fetchGenerationJob } from "@/lib/vidcica/generation";
import type { GenerationJobStatus } from "@/lib/vidcica/video";
import { RENDER_STAGES, isTerminal, stageView } from "../progress";
import { useT } from "@/lib/i18n/provider";

/**
 * Live render progress. Polls the generation job every few seconds (RLS
 * read-own) and shows the staged pipeline, not a bare spinner (AC-12). On
 * success it refreshes so the RSC swaps in the finished player; on failure it
 * shows a plain message noting the refund (AC-13).
 */
export function RenderProgress({
  jobId,
  initialStatus,
}: {
  videoId: string;
  jobId: string;
  initialStatus: GenerationJobStatus;
}) {
  const t = useT();
  const router = useRouter();
  const [status, setStatus] = useState<GenerationJobStatus>(initialStatus);

  useEffect(() => {
    if (status === "succeeded") {
      router.refresh(); // finished → RSC now renders the player
      return;
    }
    if (isTerminal(status)) return; // failed/cancelled — nothing to poll

    let active = true;
    const supabase = createClient();
    const timer = setInterval(async () => {
      const job = await fetchGenerationJob(supabase, jobId);
      if (!active || !job) return;
      setStatus(job.status);
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [status, jobId, router]);

  const view = stageView(status);

  if (view.failed) {
    return (
      <div role="alert" className="border-destructive/40 flex flex-col gap-3 rounded-xl border p-5">
        <h2 className="text-base font-semibold">{t("videos.renderFailedTitle")}</h2>
        <p className="text-muted-foreground text-sm">{t("videos.renderFailedBody")}</p>
        <Button onClick={() => router.push("/create")} className="self-start">
          {t("videos.newVideo")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" data-testid="render-progress">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t(view.labelKey)}</p>
          <p className="text-muted-foreground text-xs">{view.pct}%</p>
        </div>
        <Progress value={view.pct} label={t(view.labelKey)} />
      </div>
      <ol className="flex flex-col gap-2">
        {RENDER_STAGES.map((stage, i) => {
          const state = i < view.index ? "done" : i === view.index ? "active" : "pending";
          return (
            <li key={stage.status} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "size-2 rounded-full",
                  state === "done" && "bg-success",
                  state === "active" && "bg-primary animate-pulse",
                  state === "pending" && "bg-muted",
                )}
              />
              <span className={cn(state === "pending" && "text-muted-foreground")}>
                {t(stage.labelKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
