import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Where /auth/confirm lands an app sign-up (status=ok) or any expired/reused
 * link (status=invalid). The session it creates lives in this browser, so an
 * app user is told to go back to the app and sign in there.
 */
export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getT();
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <main className="bg-background mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
      <Link
        href="/"
        aria-label="Vidcica"
        className="focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <LogoMark className="size-12" />
      </Link>
      <h1 className="mt-8 text-[28px] leading-tight font-semibold tracking-[-0.03em]">
        {ok ? t("auth.confirmed.title") : t("auth.confirmed.invalidTitle")}
      </h1>
      <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
        {ok ? t("auth.confirmed.body") : t("auth.confirmed.invalidBody")}
      </p>
      <div className="mt-8 flex w-full flex-col gap-2">
        {ok ? (
          <>
            {/* Opens the app on a phone that has it; does nothing on desktop,
                which is why the web option sits right under it. */}
            <a href="vidcica://" className={buttonVariants({ size: "lg" })}>
              {t("auth.confirmed.openApp")}
            </a>
            <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
              {t("auth.confirmed.continueWeb")}
            </Link>
          </>
        ) : (
          <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
            {t("auth.confirmed.signIn")}
          </Link>
        )}
      </div>
    </main>
  );
}
