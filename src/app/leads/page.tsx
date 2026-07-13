import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyLeads } from "@/lib/vidcica/leads-queries";
import { LeadsList, LeadsStoreProvider } from "@/features/leads";

export const metadata = { title: "Prospects" };
export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/leads");

  const leads = await listMyLeads();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Prospects</h1>
        <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
          Mes publicités →
        </Link>
      </header>
      <p className="text-muted-foreground text-sm">
        Suivez les prospects captés par vos campagnes et relancez-les au bon moment.
      </p>
      <LeadsStoreProvider userId={user.id} initial={leads}>
        <LeadsList />
      </LeadsStoreProvider>
    </main>
  );
}
