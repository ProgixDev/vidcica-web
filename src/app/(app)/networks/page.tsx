import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { connectablePlatforms } from "@/lib/vidcica/network";
import { TIERS } from "@/lib/vidcica/tiers";
import { NetworkList } from "@/features/networks";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Réseaux sociaux" };
export const dynamic = "force-dynamic";

export default async function NetworksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/networks");

  const [networks, t, entitlement] = await Promise.all([
    listMyNetworks(),
    getT(),
    getMyEntitlement(),
  ]);

  // The plan's network allowance (Free 1, Starter 3), enforced by the server
  // (oauth-start, oauth-callback). A plan allowing at least as many networks as
  // there are to connect (Pro and Studio: TIERS networks 7) shows no limit.
  const tier = TIERS[entitlement.plan];
  const available = new Set(connectablePlatforms().map((p) => p.provider)).size;
  const allowance = {
    limit: tier.networks >= available ? null : tier.networks,
    planLabel: t(tier.labelKey),
  };

  return (
    <>
      <PageHeader title={t("networks.title")} subtitle={t("networks.subtitle")} />
      <div className="w-full max-w-3xl">
        <NetworkList initial={networks} allowance={allowance} />
      </div>
    </>
  );
}
