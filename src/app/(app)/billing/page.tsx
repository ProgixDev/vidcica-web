import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { Paywall } from "@/features/billing";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Abonnement" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing");

  const entitlement = await getMyEntitlement();

  return (
    <>
      <PageHeader
        title="Abonnement"
        subtitle="Ton offre, tes crédits du mois et les formules disponibles."
      />
      <Paywall userId={user.id} entitlement={entitlement} />
    </>
  );
}
