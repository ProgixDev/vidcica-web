import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { listMyCreditLedger } from "@/lib/vidcica/credit-ledger-queries";
import { CreditsView } from "@/features/billing";
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

  const [entitlement, entries] = await Promise.all([getMyEntitlement(), listMyCreditLedger()]);

  return (
    <>
      <PageHeader title={t("billing.credits.title")} subtitle={t("billing.credits.subtitle")} />
      <CreditsView
        userId={user.id}
        plan={entitlement.plan}
        initialCredits={entitlement.credits}
        entries={entries}
      />
    </>
  );
}
