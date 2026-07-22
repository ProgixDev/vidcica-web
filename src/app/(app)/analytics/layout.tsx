import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/app-shell";
import { AnalyticsNav, AnalyticsLocked } from "@/features/analytics";

/**
 * Analytics section shell — one auth guard + plan gate for all four tabs (the web
 * counterpart of the mobile 4-screen analytics module). Free plan is locked
 * (mirrors `isAnalyticsLocked`); when locked we do not render `children`, so the
 * per-tab pages never run their data fetches. Each tab reads `?range=` itself.
 */
export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/analytics");

  const [t, entitlement] = await Promise.all([getT(), getMyEntitlement()]);

  if (entitlement.plan === "free") {
    return (
      <>
        <PageHeader title={t("analytics.title")} subtitle={t("analytics.subtitle")} />
        <AnalyticsLocked t={t} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("analytics.title")} subtitle={t("analytics.subtitle")} />
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <Suspense fallback={null}>
          <AnalyticsNav />
        </Suspense>
        {children}
      </div>
    </>
  );
}
