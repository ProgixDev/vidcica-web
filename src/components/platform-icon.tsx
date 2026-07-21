/**
 * Social-platform brand marks — the web port of the mobile app's
 * `PlatformIcon` (ClipFlow/src/components/ui/PlatformIcon.tsx + PLATFORM_COLORS).
 * Each mark is an inline SVG on a rounded brand tile (same approach as
 * `features/create/components/model-icons.tsx`), so platforms read with their
 * real visual identity in the networks screen and the publish composer.
 *
 * Brand hex is intentional and allowed here — these are external brand colours,
 * not theme tokens (the web repo has no `check:colors` gate; cf. model-icons).
 */
import { cn } from "@/lib/utils";
import type { PlatformId } from "@/lib/vidcica/network";

/** Canonical brand colour per platform (mirrors mobile PLATFORM_COLORS). */
export const PLATFORM_COLORS: Record<PlatformId, string> = {
  youtube: "#FF0033",
  tiktok: "#010101",
  instagram: "#E1306C",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  threads: "#000000",
  x: "#000000",
};

/** Inner glyph for each platform — white-on-brand, drawn in a 24×24 viewBox. */
const GLYPHS: Record<PlatformId, () => React.ReactNode> = {
  youtube: () => (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#FF0033" />
      <path d="M10 8.4v7.2l6.2-3.6L10 8.4z" fill="#fff" />
    </>
  ),
  tiktok: () => (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#010101" />
      {/* cyan / magenta offset echo + white note = the TikTok mark */}
      <path
        d="M15.6 6.1c.28 1.45 1.15 2.5 2.55 2.68v2.06c-1.02.02-1.98-.28-2.82-.83v3.86c0 2.35-1.9 4.13-4.16 4.13-1.28 0-2.45-.6-3.2-1.55.9.62 2 .86 3.06.6 1.28-.32 2.16-1.45 2.16-2.86V6.1h2.45z"
        fill="#25F4EE"
        opacity="0.9"
      />
      <path
        d="M14.9 6.1c.28 1.45 1.15 2.5 2.55 2.68v2.06c-1.02.02-1.98-.28-2.82-.83v3.86c0 2.35-1.9 4.13-4.16 4.13S6.3 16.33 6.3 13.98s1.9-4.13 4.17-4.13c.2 0 .38.02.57.05v2.16a2.02 2.02 0 0 0-.57-.09 1.98 1.98 0 1 0 1.98 1.98V6.1h2.44z"
        fill="#FE2C55"
        opacity="0.9"
      />
      <path
        d="M15.25 6.1c.28 1.45 1.15 2.5 2.55 2.68v2.06c-1.02.02-1.98-.28-2.82-.83v3.86c0 2.35-1.9 4.13-4.16 4.13S6.66 16.33 6.66 13.98s1.9-4.13 4.16-4.13c.2 0 .39.02.58.05v2.16a2.02 2.02 0 0 0-.58-.09 1.98 1.98 0 1 0 1.98 1.98V6.1h2.45z"
        fill="#fff"
      />
    </>
  ),
  instagram: () => (
    <>
      <defs>
        <linearGradient id="platform-ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.25" stopColor="#FA7E1E" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="0.75" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#platform-ig-grad)" />
      <rect
        x="6.2"
        y="6.2"
        width="11.6"
        height="11.6"
        rx="3.6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.05" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16.15" cy="7.85" r="1.05" fill="#fff" />
    </>
  ),
  facebook: () => (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#1877F2" />
      <path
        d="M14.6 12.55h1.9l.36-2.35H14.6V8.67c0-.68.33-1.34 1.4-1.34h1.02V5.33s-.93-.16-1.82-.16c-1.85 0-3.06 1.12-3.06 3.16v1.87H9.9v2.35h2.24V18h2.46v-5.45z"
        fill="#fff"
      />
    </>
  ),
  linkedin: () => (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#0A66C2" />
      <path
        d="M8.55 9.6H6.3V17.2h2.25V9.6zM7.42 6.15a1.32 1.32 0 1 0 0 2.64 1.32 1.32 0 0 0 0-2.64zM17.7 17.2h-2.25v-3.75c0-.94-.34-1.58-1.18-1.58-.64 0-1.02.43-1.19.85-.06.15-.08.36-.08.57v3.91h-2.25s.03-6.35 0-7.01h2.25v.99c.3-.46.83-1.12 2.03-1.12 1.48 0 2.6.97 2.6 3.06v3.08z"
        fill="#fff"
      />
    </>
  ),
  threads: () => (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#000" />
      <path
        d="M16.3 11.6c-.08-.04-.17-.08-.26-.11-.15-2.85-1.7-4.48-4.32-4.5h-.04c-1.56 0-2.86.67-3.66 1.88l1.24.85c.6-.9 1.53-1.1 2.42-1.1h.02c.68 0 1.2.2 1.53.6.24.28.4.68.48 1.17a8.6 8.6 0 0 0-1.93-.09c-1.95.11-3.2 1.25-3.12 2.83.05.8.44 1.5 1.12 1.95.57.38 1.3.57 2.07.53 1.01-.06 1.8-.45 2.36-1.16.42-.54.69-1.24.8-2.12.47.29.82.66 1.01 1.11.33.76.35 2-.66 3.02-.89.88-1.95 1.27-3.55 1.28-1.78-.01-3.12-.58-3.99-1.68C7.8 14.5 7.4 13.06 7.38 11.3c.02-1.76.43-3.2 1.22-4.26.87-1.1 2.21-1.67 3.99-1.68 1.79.01 3.15.58 4.04 1.7.44.55.77 1.24.98 2.06l1.45-.39c-.26-1.01-.68-1.88-1.26-2.6-1.14-1.44-2.82-2.18-4.99-2.2h-.01c-2.16.02-3.82.76-4.94 2.2C6.84 7.7 6.32 9.47 6.3 11.3v.01c.02 1.83.54 3.6 1.55 4.88 1.12 1.44 2.78 2.18 4.94 2.2h.01c1.92-.01 3.27-.52 4.39-1.62 1.46-1.44 1.42-3.25.94-4.36-.34-.8-.99-1.44-1.87-1.87l.04.06z"
        fill="#fff"
      />
    </>
  ),
  x: () => (
    <>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#000" />
      <path
        d="M7 6.6l3.98 5.32L7 17.4h1.32l3.28-3.55 2.66 3.55H18l-4.2-5.62L17.5 6.6h-1.32l-3.05 3.3-2.47-3.3H7z"
        fill="#fff"
      />
    </>
  ),
};

export type PlatformIconProps = {
  platform: PlatformId;
  /** px size of the square mark (default 28). */
  size?: number;
  /** Dim the tile for a disconnected / inactive state. */
  muted?: boolean;
  className?: string;
};

/** Rounded brand tile with the platform glyph. Pure SVG — safe in RSC. */
export function PlatformIcon({ platform, size = 28, muted, className }: PlatformIconProps) {
  const Glyph = GLYPHS[platform];
  return (
    <svg
      role="img"
      aria-label={platform}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", muted && "opacity-70", className)}
    >
      <Glyph />
    </svg>
  );
}
