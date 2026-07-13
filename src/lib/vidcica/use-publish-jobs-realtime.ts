"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapPublishFailureReason, type PublishFailureReason } from "@/lib/vidcica/publishing";
import type { PlatformId } from "@/lib/vidcica/network";

export type PublishJobView = {
  status: "queued" | "running" | "succeeded" | "failed" | string;
  reason?: PublishFailureReason;
};

/** Per-platform publish status, keyed by platform. */
export type PublishStatusMap = Partial<Record<PlatformId, PublishJobView>>;

type JobRow = { platform?: string; status?: string; last_error?: string | null; video_id?: string };

/** Fold a publish_jobs change into the per-platform map. Pure — unit-tested (AC-9). */
export function mergePublishJob(map: PublishStatusMap, row: JobRow): PublishStatusMap {
  if (!row.platform || !row.status) return map;
  const view: PublishJobView = {
    status: row.status,
    reason: row.status === "failed" ? mapPublishFailureReason(row.last_error) : undefined,
  };
  return { ...map, [row.platform as PlatformId]: view };
}

/**
 * Subscribe to the caller's publish_jobs and project each change onto the
 * per-platform status map for a given video (AC-9 live status).
 */
export function usePublishJobsRealtime(userId: string, videoId: string): PublishStatusMap {
  const [statuses, setStatuses] = useState<PublishStatusMap>({});
  // Reset the map when the target video changes (render-phase, not an effect).
  const [prevVideoId, setPrevVideoId] = useState(videoId);
  if (videoId !== prevVideoId) {
    setPrevVideoId(videoId);
    setStatuses({});
  }

  // Supabase realtime filters on a single column, so we filter to the user here
  // and match the specific video client-side below.
  useEffect(() => {
    if (!userId || !videoId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`publish_jobs:${userId}:${videoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "publish_jobs", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          const row = payload.new as JobRow;
          if (row.video_id !== videoId) return;
          setStatuses((m) => mergePublishJob(m, row));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, videoId]);

  return statuses;
}
