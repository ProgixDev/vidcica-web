"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Showcase clip that can prove an audio claim.
 *
 * The examples grid says things like "AI voiceover" and "built-in music", so the
 * clip under each claim has to be audible on demand — otherwise the label is a
 * promise, not evidence. Browsers only autoplay muted, so we autoplay muted and
 * expose an explicit sound toggle.
 *
 * Only one clip may be audible at a time: unmuting broadcasts on `window` and
 * every other instance mutes itself. Otherwise three loops talk over each other.
 *
 * Playback still pauses off-screen and honours prefers-reduced-motion (the
 * poster stays, and the toggle still works for anyone who wants to listen).
 */

const UNMUTE_EVENT = "vidcica:showcase-unmute";

export function ShowcaseVideo({
  src,
  poster,
  className,
  soundOnLabel,
  soundOffLabel,
}: {
  src: string;
  poster: string;
  className?: string;
  /** Accessible label for the "turn sound on" state. */
  soundOnLabel: string;
  /** Accessible label for the "turn sound off" state. */
  soundOffLabel: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [audible, setAudible] = useState(false);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) void el.play().catch(() => undefined);
          else el.pause();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Another clip took the audio — go quiet.
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail === id) return;
      const el = ref.current;
      if (el) el.muted = true;
      setAudible(false);
    };
    window.addEventListener(UNMUTE_EVENT, onOther);
    return () => window.removeEventListener(UNMUTE_EVENT, onOther);
  }, [id]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = !audible;
    if (next) {
      window.dispatchEvent(new CustomEvent(UNMUTE_EVENT, { detail: id }));
      // Restart so the voiceover is heard from the beginning, not mid-sentence.
      el.currentTime = 0;
      void el.play().catch(() => undefined);
    }
    el.muted = !next;
    setAudible(next);
  }, [audible, id]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        className={className}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={audible}
        aria-label={audible ? soundOffLabel : soundOnLabel}
        title={audible ? soundOffLabel : soundOnLabel}
        className="text-foreground/90 focus-visible:ring-ring absolute top-3 right-3 grid size-8 place-items-center rounded-full border border-white/20 bg-black/45 backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:ring-2 focus-visible:outline-none"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          {audible ? (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </>
          ) : (
            <path d="m16 9 5 6m0-6-5 6" />
          )}
        </svg>
      </button>
    </>
  );
}
