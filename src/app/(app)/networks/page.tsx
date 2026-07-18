import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { NetworkList } from "@/features/networks";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Réseaux sociaux" };
export const dynamic = "force-dynamic";

export default async function NetworksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/networks");

  const networks = await listMyNetworks();

  return (
    <>
      <PageHeader
        title="Réseaux sociaux"
        subtitle="Connecte tes comptes pour publier tes vidéos en un clic."
      />
      <div className="w-full max-w-3xl">
        <NetworkList initial={networks} />
      </div>
    </>
  );
}
