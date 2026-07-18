"use client";

import { useEffect, useRef } from "react";

/**
 * Muted looping showcase video for the landing page. Client-side because SSR
 * never emits the `muted` attribute (React renders it as a property only), so
 * autoplay would be blocked — we set it via ref before playing. Plays only
 * while in the viewport and respects prefers-reduced-motion (poster stays).
 */
export function LandingVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

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

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
