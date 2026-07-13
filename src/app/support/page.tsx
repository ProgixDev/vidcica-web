import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SupportTabs } from "@/features/support";

export const metadata = { title: "Aide & support" };
export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/support");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Aide &amp; support</h1>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Mes vidéos
        </Link>
      </header>
      <SupportTabs />
    </main>
  );
}
