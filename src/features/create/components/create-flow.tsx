"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateStore } from "../provider";
import { Composer } from "./composer";
import { PlanReview } from "./plan-review";

/** Switches the create surface by phase and routes to the render view on success. */
export function CreateFlow({ credits }: { credits: number }) {
  const router = useRouter();
  const phase = useCreateStore((s) => s.phase);
  const result = useCreateStore((s) => s.result);

  useEffect(() => {
    if (phase === "done" && result) {
      router.push(`/videos/${result.videoId}`);
    }
  }, [phase, result, router]);

  const showReview =
    phase === "review" || phase === "enqueuing" || phase === "blocked" || phase === "done";

  return (
    <div className="flex w-full flex-col gap-6">
      {showReview ? <PlanReview /> : <Composer credits={credits} />}
    </div>
  );
}
