"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";
import { createUploadedVideo } from "../actions";

const BUCKET = "user-uploads";
const ACCEPT = "video/mp4,video/quicktime,video/webm";
const ACCEPT_SET = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB — matches the bucket limit

type Phase = "idle" | "reading" | "uploading" | "saving";
type Ratio = "9:16" | "1:1" | "16:9";

/** «Importer une vidéo» — pick/drag a video from the device, upload it to the
 *  public user-uploads bucket, and register it as a ready-to-publish library
 *  video. Metadata (duration, aspect ratio) + a poster frame are read in the
 *  browser so nothing extra is asked of the user. */
export function UploadVideoButton() {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const busy = phase !== "idle";

  function close() {
    if (busy) return;
    setOpen(false);
    setError(null);
    setDragging(false);
  }

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPT_SET.has(file.type)) return setError(t("videos.upload.errType"));
    if (file.size > MAX_BYTES) return setError(t("videos.upload.errSize"));

    try {
      setPhase("reading");
      const meta = await probeVideo(file);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhase("idle");
        return setError(t("videos.upload.errFailed"));
      }

      setPhase("uploading");
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const base = `${user.id}/${crypto.randomUUID()}`;
      const videoPath = `${base}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(videoPath, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) {
        setPhase("idle");
        return setError(t("videos.upload.errFailed"));
      }
      const videoUrl = supabase.storage.from(BUCKET).getPublicUrl(videoPath).data.publicUrl;

      // Best-effort poster — a failed thumbnail must never fail the import.
      let thumbnailUrl = "";
      if (meta.thumbnail) {
        const { error: tErr } = await supabase.storage
          .from(BUCKET)
          .upload(`${base}.jpg`, meta.thumbnail, { contentType: "image/jpeg", upsert: false });
        if (!tErr) {
          thumbnailUrl = supabase.storage.from(BUCKET).getPublicUrl(`${base}.jpg`).data.publicUrl;
        }
      }

      setPhase("saving");
      const res = await createUploadedVideo({
        title: cleanTitle(file.name),
        videoUrl,
        thumbnailUrl,
        durationSec: meta.durationSec,
        format: meta.ratio,
      });
      if (!res.ok) {
        setPhase("idle");
        return setError(res.message);
      }

      setPhase("idle");
      setOpen(false);
      router.refresh();
    } catch {
      setPhase("idle");
      setError(t("videos.upload.errFailed"));
    }
  }

  const phaseLabel =
    phase === "reading"
      ? t("videos.upload.reading")
      : phase === "uploading"
        ? t("videos.upload.uploading")
        : phase === "saving"
          ? t("videos.upload.saving")
          : "";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={() => setOpen(true)}
        data-testid="videos-import-button"
      >
        <UploadIcon />
        {t("videos.upload.button")}
      </Button>

      <AnimatePresence>
        {open ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={t("videos.upload.title")}
          >
            <m.button
              type="button"
              aria-label={t("videos.upload.close")}
              onClick={close}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <m.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="bg-card relative flex w-full max-w-md flex-col gap-4 rounded-3xl border p-6 shadow-2xl"
              data-testid="videos-import-dialog"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">{t("videos.upload.title")}</h2>
                <p className="text-muted-foreground text-sm">{t("videos.upload.desc")}</p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && !busy) void handleFile(f);
                }}
                data-testid="videos-import-dropzone"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors",
                  dragging
                    ? "border-primary bg-accent"
                    : "border-input hover:border-primary/60 hover:bg-accent/40",
                  busy && "pointer-events-none opacity-60",
                )}
              >
                {busy ? (
                  <>
                    <Spinner />
                    <span className="text-sm font-medium">{phaseLabel}</span>
                    <span className="text-muted-foreground text-xs">
                      {t("videos.upload.dontClose")}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
                      <UploadIcon big />
                    </span>
                    <span className="text-sm font-medium">{t("videos.upload.dropzone")}</span>
                    <span className="text-muted-foreground text-xs">{t("videos.upload.hint")}</span>
                  </>
                )}
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                data-testid="videos-import-input"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void handleFile(f);
                }}
              />

              {error ? (
                <p
                  role="alert"
                  className="text-destructive text-sm"
                  data-testid="videos-import-error"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={close}
                  disabled={busy}
                >
                  {t("videos.upload.close")}
                </Button>
              </div>
            </m.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Read duration + aspect ratio and grab a poster frame, all in the browser.
 *  Fully resilient: any failure falls back to sane defaults so the import still
 *  proceeds (a vertical short with no thumbnail). */
async function probeVideo(
  file: File,
): Promise<{ durationSec: number; ratio: Ratio; thumbnail: Blob | null }> {
  const fallback = { durationSec: 15, ratio: "9:16" as Ratio, thumbnail: null };
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("metadata"));
      }),
      8000,
    );
    const w = video.videoWidth || 9;
    const h = video.videoHeight || 16;
    const ratio: Ratio = w > h * 1.15 ? "16:9" : h > w * 1.15 ? "9:16" : "1:1";
    const durationSec = Number.isFinite(video.duration)
      ? Math.min(3600, Math.max(1, Math.round(video.duration)))
      : fallback.durationSec;
    const thumbnail = await captureFrame(video).catch(() => null);
    return { durationSec, ratio, thumbnail };
  } catch {
    return fallback;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Seek a touch into the clip and paint the frame to a (same-origin, untainted)
 *  canvas → JPEG blob. Capped at 720px on the long edge. */
async function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const at = Math.min(1, (video.duration || 2) / 2);
  await withTimeout(
    new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("seek"));
      try {
        video.currentTime = at;
      } catch {
        reject(new Error("seek"));
      }
    }),
    6000,
  );
  const vw = video.videoWidth || 720;
  const vh = video.videoHeight || 1280;
  const scale = Math.min(1, 720 / Math.max(vw, vh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/** Human title from the filename: drop the extension, tidy separators. */
function cleanTitle(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return (base || "Ma vidéo").slice(0, 120);
}

function Spinner() {
  return (
    <svg className="text-primary size-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ big }: { big?: boolean }) {
  const s = big ? 22 : 16;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
