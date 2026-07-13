"use client";

import { cn } from "@/lib/utils";

/**
 * Light/dark toggle. Flips `.dark` on <html> and persists the choice; the
 * no-flash script in layout.tsx applies the resolved theme before first paint
 * (system preference by default), so the designed dark tokens render everywhere.
 *
 * Stateless by design: the icon is driven by the `.dark` class via Tailwind's
 * class-based `dark:` variant (no React state → no hydration mismatch, no effect).
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode — the class still applies for this session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Basculer le thème clair ou sombre"
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      {/* Moon in light mode (→ switch to dark) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="size-4 dark:hidden"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        />
      </svg>
      {/* Sun in dark mode (→ switch to light) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="hidden size-4 dark:block"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path
          strokeLinecap="round"
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        />
      </svg>
    </button>
  );
}
