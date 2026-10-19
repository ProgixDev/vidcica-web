import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { Paywall } from "@/features/billing";
import { ProfileSection, ProfileLinkRow } from "@/features/profile";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("billing.metaTitle") };
}
export const dynamic = "force-dynamic";

// `?status=` arrives from /checkout/return when Stripe ran in this tab (a
// blocked popup): the paywall then says the payment is being activated.
const returnStatusSchema = z.enum(["success", "cancel", "portal", "has_subscription"]);

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing");

  const entitlement = await getMyEntitlement();
  const parsed = returnStatusSchema.safeParse((await searchParams).status);

  return (
    <>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} />
      <Paywall
        userId={user.id}
        entitlement={entitlement}
        returnStatus={parsed.success ? parsed.data : undefined}
      />
      <div className="w-full max-w-2xl">
        <ProfileSection title={t("billing.moreTitle")}>
          <ProfileLinkRow
            href="/billing/credits"
            label={t("billing.links.credits")}
            hint={t("billing.links.creditsHint")}
            testId="billing-link-credits"
          />
          <ProfileLinkRow
            href="/billing/manage"
            label={t("billing.links.manage")}
            hint={t("billing.links.manageHint")}
            testId="billing-link-manage"
          />
        </ProfileSection>
      </div>
    </>
  );
}
