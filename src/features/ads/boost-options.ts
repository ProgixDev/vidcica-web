import { hasRenderedVideo, type Video } from "@/lib/vidcica/video";
import type { VideoOption } from "./components/boost-wizard";

/**
 * The videos a creator can boost: every one with a finished, playable file
 * (Meta pulls the MP4), published or not. The Boost page used `isReady`, which
 * means "rendered AND not yet published", so a video vanished from the picker
 * the moment it was published, and its own Boost button opened a wizard that
 * couldn't select it: publish, then boost, the natural order, was impossible
 * (found 2026-10-05).
 */
export function boostOptions(
  videos: ReadonlyArray<Pick<Video, "id" | "title" | "status" | "videoUrl">>,
): VideoOption[] {
  return videos.filter(hasRenderedVideo).map((v) => ({ id: v.id, title: v.title }));
}
