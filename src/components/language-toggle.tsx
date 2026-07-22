"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/provider";

/** Persist the chosen locale (module scope — a property write inside a component
 *  body trips the react-compiler immutability rule). */
function writeLocaleCookie(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * FR/EN language toggle. Writes the locale cookie (so Server Components render
 * the chosen language on the next request) and refreshes — mirrors the mobile
 * app's live language switch. A segmented FR|EN pill.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(next: Locale) {
    if (next === locale) return;
    writeLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Langue / Language"
      className={cn(
        "border-border/70 inline-flex items-center rounded-full border p-0.5 text-xs font-semibold",
        pending && "opacity-70",
        className,
      )}
    >
      {(["fr", "en"] as const).map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => set(l)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2 py-0.5 uppercase transition-colors",
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
