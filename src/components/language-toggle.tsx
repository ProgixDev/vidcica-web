"use client";

import { cn } from "@/lib/utils";
import { useLocale, useLocaleSwitch } from "@/lib/i18n/provider";

/**
 * FR/EN language toggle. Delegates to the i18n provider's `switchLocale` (writes
 * the locale cookie + refreshes Server Components) so the whole-page crossfade
 * (LocaleTransition) shares the same `isSwitching` state. A segmented FR|EN pill.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const { isSwitching, switchLocale } = useLocaleSwitch();

  return (
    <div
      role="group"
      aria-label="Langue / Language"
      className={cn(
        "bg-secondary inline-flex h-10 items-center rounded-full p-1 text-xs font-semibold",
        isSwitching && "opacity-70",
        className,
      )}
    >
      {(["fr", "en"] as const).map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            aria-pressed={active}
            className={cn(
              "flex h-8 items-center rounded-full px-2.5 uppercase transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
