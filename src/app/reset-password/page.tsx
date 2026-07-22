import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth";
import { BrandLockup, LogoMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("auth.resetMetaTitle") };
}

/**
 * Landing page for the password-reset e-mail link. The recovery session is
 * established client-side from the link (PKCE), so this stays a thin shell over
 * the client form — no server auth guard (the user is mid-recovery, not yet a
 * normal authenticated session).
 */
export default async function ResetPasswordPage() {
  return (
    <main className="bg-background relative flex min-h-dvh w-full flex-col">
      <div className="relative z-10 flex w-full items-center justify-between px-6 py-4">
        <Link href="/" className="rounded-full px-1 py-1">
          <BrandLockup className="text-sm" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="border-border/60 bg-card flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border p-6 shadow-sm sm:p-8">
          <LogoMark className="size-14 object-contain" />
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
