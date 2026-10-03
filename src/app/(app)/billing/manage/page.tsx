import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { tierDef } from "@/lib/vidcica/tiers";
import { ManagePortalButton } from "@/features/billing";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("billing.manage.metaTitle") };
}
export const dynamic = "force-dynamic";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground mt-1 size-4 shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default async function ManageSubscriptionPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing/manage");

  const entitlement = await getMyEntitlement();
  const tier = tierDef(entitlement.plan);
  const isFree = entitlement.plan === "free";

  return (
    <>
      <PageHeader title={t("billing.manage.title")} subtitle={t("billing.manage.subtitle")} />

      <div className="flex w-full max-w-2xl flex-col gap-10">
        {/* Current plan hero — plan name is the headline, price alongside. */}
        <Card className="flex flex-col gap-2 p-6" data-testid="manage-hero">
          <span className="text-muted-foreground text-[13px]">
            {t("billing.manage.currentLabel")}
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <span
              className="text-4xl leading-tight font-semibold tracking-[-0.03em]"
              data-testid="manage-plan"
            >
              {t(tier.labelKey)}
            </span>
            {tier.priceEUR > 0 ? (
              <span className="text-muted-foreground text-[15px]">
                {tier.priceEUR} € {t("billing.perMonth")}
              </span>
            ) : (
              <Badge variant="muted">{t("billing.manage.freeBadge")}</Badge>
            )}
          </div>
          {isFree ? (
            <p className="text-muted-foreground max-w-prose pt-1 text-[15px] leading-relaxed">
              {t("billing.manage.freeBody")}
            </p>
          ) : null}
        </Card>

        {/* Included features — real values from the tier matrix. */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{t("billing.manage.includedTitle")}</h2>
          <ul className="flex flex-col gap-3">
            {/* Monthly allotment is a paid-plan concept — free is pay-as-you-go. */}
            {tier.monthlyCredits > 0 ? (
              <li className="flex items-start gap-3 text-[15px] leading-relaxed">
                <CheckIcon />
                <span>{t("billing.manage.creditsPerMonth", { credits: tier.monthlyCredits })}</span>
              </li>
            ) : null}
            {tier.highlightKeys.map((k) => (
              <li key={k} className="flex items-start gap-3 text-[15px] leading-relaxed">
                <CheckIcon />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Invoices & payment — honest: managed in the Stripe portal. */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{t("billing.manage.invoicesTitle")}</h2>
          <p className="text-muted-foreground max-w-prose text-[15px] leading-relaxed">
            {isFree ? t("billing.manage.freeInvoicesNote") : t("billing.manage.invoicesNote")}
          </p>
          {isFree ? (
            <Link
              href="/billing"
              className={cn(buttonVariants(), "w-fit")}
              data-testid="manage-upgrade"
            >
              {t("common.upgrade")}
            </Link>
          ) : (
            <ManagePortalButton />
          )}
          <p className="text-muted-foreground pt-2 text-[13px] leading-relaxed">
            {t("billing.manage.footerNote")}
          </p>
        </section>
      </div>
    </>
  );
}
