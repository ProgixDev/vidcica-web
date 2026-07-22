import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyCampaign } from "@/lib/vidcica/ads-queries";
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

  const campaign = await getMyCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
        ← {t("ads.myAds")}
      </Link>
      <CampaignDetail campaign={campaign} />
    </div>
  );
}
