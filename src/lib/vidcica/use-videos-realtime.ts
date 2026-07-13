"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowToVideo, type Video, type VideoRow } from "@/lib/vidcica/video";

/** Replace the video in place if present (no reorder jump on a status change),
 *  else prepend it (a new video shows at the top). Pure — unit-tested (AC-7). */
export function upsertVideo(list: Video[], v: Video): Video[] {
  const i = list.findIndex((x) => x.id === v.id);
  if (i === -1) return [v, ...list];
  const next = list.slice();
  next[i] = v;
  return next;
}

/** Remove a video by id. Pure. */
export function removeVideo(list: Video[], id: string): Video[] {
  return list.filter((x) => x.id !== id);
}

/**
 * Subscribe to the caller's `videos:{userId}` realtime channel and keep the
 * server-seeded list live — status changes (generating → prêt), new videos, and
 * deletes arrive without a refresh. Mirrors ClipFlow/src/store/videos.store.ts.
 */
export function useVideosRealtime(userId: string, initial: Video[]): Video[] {
  const [videos, setVideos] = useState<Video[]>(initial);
  // Re-seed from the server during render (not an effect) when a router.refresh()
  // hands down a new `initial` — the sanctioned "adjust state on prop change"
  // pattern (docs/conventions/react.md), not prop→state syncing via useEffect.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setVideos(initial);
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`videos:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "videos", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (id) setVideos((l) => removeVideo(l, id));
            return;
          }
          const row = payload.new as VideoRow;
          // A soft-deleted row (deleted_at set) leaves the active list.
          if ((row as { deleted_at?: string | null }).deleted_at) {
            setVideos((l) => removeVideo(l, row.id));
            return;
          }
          setVideos((l) => upsertVideo(l, rowToVideo(row)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return videos;
}
