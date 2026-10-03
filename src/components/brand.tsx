import { cn } from "@/lib/utils";

/**
 * Vidcica mark — identity 01 “Rémanence”: two offset flat exposures forming an
 * asymmetric V (vidcica/docs/brand/identity-01/IDENTITY.md §1). Two filled paths,
 * no stroke, no radius, no gradient. It paints in `currentColor`, so it is ink on
 * a light ground and paper on a dark one without a second asset.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M0 16H24L40 64L28 96Z M72 0H96L64 96H40Z" />
    </svg>
  );
}

/** Mark + name — the standard header/footer lockup (Manrope 600, tight tracking). */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 font-semibold", className)}>
      <LogoMark className="size-5 shrink-0" />
      <span className="text-[17px] tracking-[-0.03em]">Vidcica</span>
    </span>
  );
}
