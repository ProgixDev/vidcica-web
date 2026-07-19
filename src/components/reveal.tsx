"use client";

import { m } from "@/components/motion";

/**
 * Scroll-reveal wrapper — fades + rises content as it enters the viewport
 * (or on mount with `onMount`). Uses the shared LazyMotion setup, so
 * prefers-reduced-motion users get content instantly (MotionConfig "user").
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  onMount = false,
  className,
  style,
}: {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  /** Entrance rise distance in px. */
  y?: number;
  /** Animate immediately on mount instead of when scrolled into view. */
  onMount?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const visible = { opacity: 1, y: 0 };
  return (
    <m.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      {...(onMount ? { animate: visible } : { whileInView: visible })}
      viewport={onMount ? undefined : { once: true, margin: "-64px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.65, 0.32, 1] }}
    >
      {children}
    </m.div>
  );
}
