import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateStoreProvider, CreateFlow } from "@/features/create";

export const metadata = { title: "Créer une vidéo" };
export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/create");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Créer une vidéo</h1>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Mes vidéos
        </Link>
      </header>
      <CreateStoreProvider>
        <CreateFlow />
      </CreateStoreProvider>
    </main>
  );
}
