import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { hasMetaReviewAccess } from "@/lib/vidcica/network";
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

  const [networks, t] = await Promise.all([listMyNetworks(), getT()]);
  // Read server-side only: META_REVIEW_EMAILS must never reach the browser.
  const reviewAccess = hasMetaReviewAccess(user.email, process.env.META_REVIEW_EMAILS);

  return (
    <>
      <PageHeader title={t("networks.title")} subtitle={t("networks.subtitle")} />
      <div className="w-full max-w-5xl">
        <NetworkList initial={networks} reviewAccess={reviewAccess} />
      </div>
    </>
  );
}
