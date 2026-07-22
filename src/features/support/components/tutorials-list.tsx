"use client";

import { useT } from "@/lib/i18n/provider";
import { TUTORIALS, type TutorialAccent } from "../faq-data";

/** Token-driven gradient per accent — placeholder thumbnail, no external art. */
const ACCENT_GRADIENT: Record<TutorialAccent, string> = {
  brand: "from-primary to-primary/50",
  success: "from-success to-success/50",
  warning: "from-warning to-warning/50",
  neutral: "from-muted to-muted-foreground/20",
};

function formatDuration(sec: number, t: ReturnType<typeof useT>): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0
    ? t("help.tutorials.durationShort", { minutes: m })
    : t("help.tutorials.duration", { minutes: m, seconds: String(s).padStart(2, "0") });
}

/** Grid of tutorial cards. Thumbnails are placeholders (gradient + play glyph);
 *  no video player yet — honest "coming soon" note below. */
export function TutorialsList() {
  const t = useT();
  return (
    <div className="flex flex-col gap-4" data-testid="tutorials-list">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TUTORIALS.map((tut) => (
          <div
            key={tut.id}
            data-testid={`tutorial-${tut.id}`}
            className="bg-card flex flex-col overflow-hidden rounded-2xl border"
          >
            <div
              className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${ACCENT_GRADIENT[tut.accent]}`}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/45 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
                {formatDuration(tut.durationSec, t)}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3">
              <span className="text-sm font-semibold">{t(tut.titleKey)}</span>
              <span className="text-muted-foreground text-xs leading-relaxed">
                {t(tut.bodyKey)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground px-1 text-xs">{t("help.tutorials.player.comingSoon")}</p>
    </div>
  );
}
