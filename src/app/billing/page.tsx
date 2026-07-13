import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { Paywall } from "@/features/billing";

export const metadata = { title: "Abonnement" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/billing");

  const entitlement = await getMyEntitlement();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Abonnement</h1>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Mes vidéos
        </Link>
      </header>
      <Paywall userId={user.id} entitlement={entitlement} />
    </main>
  );
}
