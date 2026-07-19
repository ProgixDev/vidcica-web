/**
 * Per-model brand marks — ported 1:1 from the mobile app
 * (ClipFlow/src/assets/icons/ai/*.svg via AIModelIcons). Stylised, brand-
 * coloured; Pro variants reuse their base brand mark (Kling Pro → Kling,
 * Seedance Pro → Seedance), anything unmapped falls back to a film glyph.
 */

function PexelsMark() {
  return (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#05A081" />
      <path fill="#FFFFFF" d="M10 8.2l6 3.8-6 3.8V8.2z" />
    </>
  );
}

function KlingMark() {
  return (
    <>
      <defs>
        <linearGradient id="model-kling-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#model-kling-grad)" />
      <path
        fill="#FFFFFF"
        d="M8 7h2.1v4.4L13.6 7h2.6l-3.6 4.5L16.4 17h-2.6l-2.6-4-1.1 1.3V17H8V7z"
      />
    </>
  );
}

function SeedanceMark() {
  return (
    <>
      <defs>
        <linearGradient id="model-seedance-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#model-seedance-grad)" />
      <path
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        d="M16 8.5c-1.5-1-6-1-6 1.3s5.5 0.7 5.5 3-4.5 2.5-7 1.2"
      />
      <circle cx="8" cy="14.2" r="1" fill="#FFFFFF" />
    </>
  );
}

function VeoMark() {
  return (
    <>
      <defs>
        <linearGradient id="model-veo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="40%" stopColor="#9B72F2" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#0F0F10" />
      <path
        fill="url(#model-veo-grad)"
        d="M12 5l1.6 4.4 4.4 1.6-4.4 1.6L12 17l-1.6-4.4L6 11l4.4-1.6L12 5z"
      />
    </>
  );
}

function LtxMark() {
  return (
    <>
      <defs>
        <linearGradient id="model-ltx-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#model-ltx-grad)" />
      <text
        x="12"
        y="15.2"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7.5"
        fontWeight="700"
        fill="#FFFFFF"
      >
        LTX
      </text>
    </>
  );
}

function FallbackMark() {
  return (
    <>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        d="M7 2v20M17 2v20M2 8h5M2 16h5M17 8h5M17 16h5"
      />
    </>
  );
}

const MARKS: Record<string, () => React.ReactNode> = {
  pexels: PexelsMark,
  kling: KlingMark,
  "kling-pro": KlingMark,
  seedance: SeedanceMark,
  "seedance-pro": SeedanceMark,
  veo: VeoMark,
  ltx: LtxMark,
};

export function ModelIcon({ id, className }: { id: string; className?: string }) {
  const Mark = MARKS[id] ?? FallbackMark;
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className ?? "size-5"}>
      <Mark />
    </svg>
  );
}
