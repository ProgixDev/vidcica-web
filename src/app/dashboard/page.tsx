import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { VideoList } from "@/features/videos";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Tableau de bord" };

// Reads run per-request against the RLS-scoped session (no static cache).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const videos = await listMyVideos();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="bg-primary inline-block size-3 rounded-full" />
          <h1 className="text-lg font-semibold tracking-tight">Mes vidéos</h1>
        </div>
        <Link href="/create" className={buttonVariants()}>
          Créer une vidéo
        </Link>
      </header>
      <VideoList userId={user.id} initial={videos} />
    </main>
  );
}
