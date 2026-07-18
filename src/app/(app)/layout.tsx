import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { listMyNotifications } from "@/lib/vidcica/notifications-queries";
import { tierDef } from "@/lib/vidcica/tiers";
import { AppShell } from "@/components/app-shell";
import { NotificationBell } from "@/features/notifications";

/**
 * Authenticated shell — one guard + one entitlement fetch for every app page
 * (the web counterpart of the mobile tab navigator). Pages inside keep their
 * own RLS-scoped data fetches; this layout only owns the chrome.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [entitlement, notifications] = await Promise.all([
    getMyEntitlement(),
    listMyNotifications(),
  ]);
  const tier = tierDef(entitlement.plan);

  return (
    <AppShell
      userId={user.id}
      email={user.email ?? ""}
      planLabel={tier.label}
      credits={entitlement.credits}
      monthlyCredits={tier.monthlyCredits}
      bell={<NotificationBell userId={user.id} initial={notifications} />}
    >
      {children}
    </AppShell>
  );
}
