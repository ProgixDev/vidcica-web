import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement, listCreditPacks } from "@/lib/vidcica/billing-queries";
import { listMyCreditLedger } from "@/lib/vidcica/credit-ledger-queries";
import { CreditsView, BuyCreditsSection } from "@/features/billing";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("billing.credits.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing/credits");

  const [entitlement, entries, packs] = await Promise.all([
    getMyEntitlement(),
    listMyCreditLedger(),
    listCreditPacks(),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader title={t("billing.credits.title")} subtitle={t("billing.credits.subtitle")} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CreditsView
          userId={user.id}
          plan={entitlement.plan}
          initialCredits={entitlement.credits}
          entries={entries}
        />
        <BuyCreditsSection packs={packs} />
      </div>
    </div>
  );
}
