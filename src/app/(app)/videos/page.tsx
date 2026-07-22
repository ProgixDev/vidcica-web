import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { VideoList } from "@/features/videos";
import { PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("videos.metaTitle") };
}
export const dynamic = "force-dynamic";

/** Full video library — the web counterpart of the app's «Vidéos» tab. */
export default async function VideosPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/videos");

  const videos = await listMyVideos();

  return (
    <>
      <PageHeader
        title={t("videos.title")}
        subtitle={
          videos.length === 1
            ? t("videos.subtitleOne", { count: videos.length })
            : t("videos.subtitleMany", { count: videos.length })
        }
        actions={
          <>
            <Link
              href="/videos/trash"
              className="text-muted-foreground hover:text-foreground text-sm"
              data-testid="videos-trash-link"
            >
              {t("library.trash.title")}
            </Link>
            <Link href="/create" className={buttonVariants({ className: "rounded-full" })}>
              {t("videos.create")}
            </Link>
          </>
        }
      />
      <VideoList userId={user.id} initial={videos} manage />
    </>
  );
}
