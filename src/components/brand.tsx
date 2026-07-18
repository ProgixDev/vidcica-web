import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Vidcica brand lockup. The mark is the real app logo (the orange V-G
 * monogram from ClipFlow/src/assets/branding/logo-mark.png — also the mobile
 * splash icon), trimmed to its content box and self-hosted in /public/brand.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      width={512}
      height={512}
      aria-hidden="true"
      className={className}
    />
  );
}

/** Logo mark + name — the standard header/footer lockup. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className="size-7 shrink-0 object-contain" />
      <span className="text-base">Vidcica</span>
    </span>
  );
}
