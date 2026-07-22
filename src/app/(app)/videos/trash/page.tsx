import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyTrashedVideos } from "@/lib/vidcica/videos-queries";
import { TrashList } from "@/features/videos";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("library.trash.metaTitle") };
}
export const dynamic = "force-dynamic";

/** Trash — the caller's soft-deleted videos (restorable until the purge cron). */
export default async function VideosTrashPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/videos/trash");

  const trashed = await listMyTrashedVideos();

  return (
    <>
      <PageHeader
        title={t("library.trash.title")}
        subtitle={t("library.trash.subtitle")}
        actions={
          <Link href="/videos" className="text-muted-foreground hover:text-foreground text-sm">
            ← {t("videos.title")}
          </Link>
        }
      />
      <div className="w-full max-w-2xl">
        <TrashList initial={trashed} />
      </div>
    </>
  );
}
