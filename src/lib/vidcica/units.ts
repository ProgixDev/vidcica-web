/**
 * Video lengths and storage sizes as the client's mockup writes them
 * (brief "Cahier technique", 2026-10-23): "15 s", "60 s", "1 min 30", "3 min";
 * "30 Mo", "1 Go". Used by the plan table, the refusal messages and the create
 * screen, so a plan limit reads the same everywhere.
 */
import type { TFunction } from "@/lib/i18n";

/** Up to a minute in seconds ("60 s"), then minutes ("1 min 30", "3 min"). */
export function formatVideoLength(sec: number, t: TFunction): string {
  const total = Math.round(sec);
  if (total <= 60) return t("units.seconds", { n: total });
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s === 0
    ? t("units.minutes", { m })
    : t("units.minutesSeconds", { m, s: String(s).padStart(2, "0") });
}

/** Whole gigabytes read as "Go"/"GB", anything else as megabytes. */
export function formatMegabytes(mb: number, t: TFunction): string {
  return mb >= 1024 && mb % 1024 === 0
    ? t("units.gb", { n: mb / 1024 })
    : t("units.mb", { n: Math.round(mb) });
}
