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
  videoId,
  jobId,
  initialStatus,
  initialLastError = null,
}: {
  videoId: string;
  jobId: string;
  initialStatus: GenerationJobStatus;
  initialLastError?: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [status, setStatus] = useState<GenerationJobStatus>(initialStatus);
  const [lastError, setLastError] = useState<string | null>(initialLastError);

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
      setLastError(job.lastError);
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [status, jobId, router]);

  const view = stageView(status);
  // The worker stops a voiceover longer than the video can be ("script_too_long:72")
  // before ordering footage. Say so, and reopen the script to shorten it.
  const tooLong = view.failed ? /^script_too_long:(\d+)/.exec(lastError ?? "") : null;

  if (tooLong) {
    return (
      <div role="alert" className="bg-destructive-subtle flex flex-col gap-5 rounded-lg p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-destructive text-[17px] font-semibold">
            {t("videos.renderTooLongTitle")}
          </h2>
          <p className="text-subtle-foreground text-[13px] leading-relaxed">
            {t("videos.renderTooLongBody", { seconds: tooLong[1] ?? "" })}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/create?draft=${encodeURIComponent(videoId)}`)}
          className="self-start"
        >
          {t("videos.shortenScript")}
        </Button>
      </div>
    );
  }

  if (view.failed) {
    return (
      <div role="alert" className="bg-destructive-subtle flex flex-col gap-5 rounded-lg p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-destructive text-[17px] font-semibold">
            {t("videos.renderFailedTitle")}
          </h2>
          <p className="text-subtle-foreground text-[13px] leading-relaxed">
            {t("videos.renderFailedBody")}
          </p>
        </div>
        <Button onClick={() => router.push("/create")} className="self-start">
          {t("videos.newVideo")}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card flex flex-col gap-6 rounded-lg p-6" data-testid="render-progress">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold">{t(view.labelKey)}</p>
          <p className="text-muted-foreground text-[13px] tabular-nums">{view.pct}%</p>
        </div>
        <Progress value={view.pct} label={t(view.labelKey)} />
      </div>
      <ol className="flex flex-col gap-3">
        {RENDER_STAGES.map((stage, i) => {
          const state = i < view.index ? "done" : i === view.index ? "active" : "pending";
          return (
            <li key={stage.status} className="flex items-center gap-3 text-[13px]">
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  state === "done" && "bg-muted-foreground",
                  state === "active" && "bg-foreground animate-pulse motion-reduce:animate-none",
                  state === "pending" && "bg-accent",
                )}
              />
              <span
                className={cn(
                  state === "done" && "text-subtle-foreground",
                  state === "active" && "font-semibold",
                  state === "pending" && "text-muted-foreground",
                )}
              >
                {t(stage.labelKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
