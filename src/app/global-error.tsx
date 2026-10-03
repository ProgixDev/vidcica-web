"use client";

import { ErrorReporter } from "@/components/error-reporter";

/**
 * Root error boundary — catches errors in the root layout itself, so it must
 * render its own <html>/<body>. Kept dependency-light on purpose: this runs
 * when the layout has already failed, so the reporting lives in
 * <ErrorReporter/>, which no-ops when the analytics provider is not mounted.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <ErrorReporter error={error} />
        <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Something went wrong.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-[15px] leading-relaxed">
            An unexpected error occurred. You can try again, or head back home.
          </p>
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:ring-ring focus-visible:ring-offset-background mt-10 inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
