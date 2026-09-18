import Link from "next/link";
import type { Metadata } from "next";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-5 py-10">
      <Link href="/" className="text-primary text-lg font-bold tracking-tight">
        Vidcica
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {ok ? t("auth.confirmed.title") : t("auth.confirmed.invalidTitle")}
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {ok ? t("auth.confirmed.body") : t("auth.confirmed.invalidBody")}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {ok ? (
          <>
            {/* Opens the app on a phone that has it; does nothing on desktop,
                which is why the web option sits right under it. */}
            <a href="vidcica://" className={buttonVariants()}>
              {t("auth.confirmed.openApp")}
            </a>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              {t("auth.confirmed.continueWeb")}
            </Link>
          </>
        ) : (
          <Link href="/sign-in" className={buttonVariants()}>
            {t("auth.confirmed.signIn")}
          </Link>
        )}
      </div>
    </main>
  );
}
