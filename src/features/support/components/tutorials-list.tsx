"use client";

import { useT } from "@/lib/i18n/provider";
import { TUTORIALS, type TutorialAccent } from "../faq-data";

/** One atmospheric field per accent — placeholder thumbnail, no external art. */
const ACCENT_FIELD: Record<TutorialAccent, string> = {
  brand: "field-aube",
  success: "field-contre-jour",
  warning: "field-apres-image",
  neutral: "field-papier",
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
            className="bg-card flex flex-col overflow-hidden rounded-lg"
          >
            <div
              className={`grain relative flex aspect-video items-center justify-center ${ACCENT_FIELD[tut.accent]}`}
            >
              <span className="bg-scrim flex size-12 items-center justify-center rounded-full text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="bg-scrim absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-xs leading-none font-semibold text-white">
                {formatDuration(tut.durationSec, t)}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-5">
              <span className="text-[15px] leading-snug font-semibold">{t(tut.titleKey)}</span>
              <span className="text-muted-foreground text-[13px] leading-relaxed">
                {t(tut.bodyKey)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-[13px]">{t("help.tutorials.player.comingSoon")}</p>
    </div>
  );
}
