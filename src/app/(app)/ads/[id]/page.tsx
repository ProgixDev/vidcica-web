import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyAdAccountCurrency, getMyCampaign } from "@/lib/vidcica/ads-queries";
import { CampaignDetail } from "@/features/ads";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/ads/${id}`);

  const [campaign, currency] = await Promise.all([getMyCampaign(id), getMyAdAccountCurrency()]);
  if (!campaign) notFound();

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <Link
        href="/ads"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background self-start rounded-full text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        ← {t("ads.myAds")}
      </Link>
      <CampaignDetail campaign={campaign} currency={currency} />
    </div>
  );
}
