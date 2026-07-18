import { cn } from "@/lib/utils";

/**
 * Vidcica brand lockup. The mark is the mobile app icon glyph ported from
 * ClipFlow/src/assets/branding/logo-mark.svg (filters dropped for crisp inline
 * rendering). This is one of the ~2 sanctioned gradient surfaces (globals.css)
 * — the raw brand hexes live only here and in app/icon.svg / opengraph-image.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient
          id="vidcica-frame"
          x1="0"
          y1="0"
          x2="256"
          y2="256"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C75A1A" />
          <stop offset="55%" stopColor="#FF8A3D" />
          <stop offset="100%" stopColor="#FFD9B0" />
        </linearGradient>
        <linearGradient
          id="vidcica-glyph"
          x1="0"
          y1="0"
          x2="0"
          y2="256"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFDF6" />
          <stop offset="100%" stopColor="#FFE7C8" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="56" fill="url(#vidcica-frame)" />
      <path
        fill="url(#vidcica-glyph)"
        d="M 60 96 C 84 76, 108 76, 132 96 C 152 112, 168 112, 188 96 L 196 128 C 176 144, 156 152, 132 148 C 112 144, 92 144, 72 152 Z M 132 152 C 156 152, 176 144, 196 128 L 196 128 L 200 132 L 200 168 L 132 200 Z M 60 96 C 56 116, 56 140, 60 160 C 64 176, 72 184, 80 188 L 88 152 C 80 144, 72 132, 72 116 Z"
      />
    </svg>
  );
}

/** Logo mark + name — the standard header/footer lockup. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className="size-7 shrink-0" />
      <span className="text-base">Vidcica</span>
    </span>
  );
}
