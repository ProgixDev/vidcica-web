import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { Paywall } from "@/features/billing";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("billing.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing");

  const entitlement = await getMyEntitlement();

  return (
    <>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} />
      <Paywall userId={user.id} entitlement={entitlement} />
    </>
  );
}
