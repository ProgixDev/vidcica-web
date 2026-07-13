import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { NetworkList } from "@/features/networks";

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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Réseaux sociaux</h1>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Mes vidéos
        </Link>
      </header>
      <p className="text-muted-foreground text-sm">
        Connectez vos comptes pour publier vos vidéos en un clic.
      </p>
      <NetworkList initial={networks} />
    </main>
  );
}
