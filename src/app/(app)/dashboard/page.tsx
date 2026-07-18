import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { isReady, isRendering } from "@/lib/vidcica/video";
import { VideoList } from "@/features/videos";
import { QuickComposer } from "@/features/create";

export const metadata = { title: "Accueil" };

// Reads run per-request against the RLS-scoped session (no static cache).
export const dynamic = "force-dynamic";

/** First name for the greeting: OAuth full name → email prefix → nothing. */
function firstName(meta: Record<string, unknown>, email: string | undefined): string | null {
  const full = typeof meta.full_name === "string" ? meta.full_name : undefined;
  const name = full ?? (typeof meta.name === "string" ? meta.name : undefined);
  if (name) return name.split(" ")[0] ?? null;
  return email?.split("@")[0] ?? null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const videos = await listMyVideos();
  const name = firstName(user.user_metadata ?? {}, user.email);
  const ready = videos.filter((v) => isReady(v)).length;
  const rendering = videos.filter((v) => isRendering(v.status)).length;

  return (
    <>
      {/* Hero — the app's home greeting + composer-first entry */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bonjour{name ? ` ${name}` : ""} 👋
          </h1>
          <p className="text-muted-foreground text-sm">Crée une vidéo en quelques secondes.</p>
        </div>
        <QuickComposer />
      </section>

      {/* Quick stats */}
      <section aria-label="Statistiques" className="grid grid-cols-3 gap-4">
        {[
          { value: videos.length, label: "vidéos au total" },
          { value: ready, label: "prêtes à publier" },
          { value: rendering, label: "en génération" },
        ].map((s) => (
          <div
            key={s.label}
            className="border-border bg-card flex flex-col gap-0.5 rounded-md border p-4"
          >
            <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
            <span className="text-muted-foreground text-xs">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Recent videos */}
      <section className="flex flex-col gap-4" aria-labelledby="recent-h">
        <div className="flex items-center justify-between">
          <h2 id="recent-h" className="text-base font-semibold tracking-tight">
            Tes vidéos récentes
          </h2>
          <Link href="/videos" className="text-muted-foreground hover:text-foreground text-sm">
            Voir tout →
          </Link>
        </div>
        <VideoList userId={user.id} initial={videos.slice(0, 8)} />
      </section>
    </>
  );
}
