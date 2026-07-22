import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { listMyNotifications } from "@/lib/vidcica/notifications-queries";
import { NotificationCenter } from "@/features/notifications";
import { PageHeader } from "@/components/app-shell";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("notifications.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/notifications");

  const notifications = await listMyNotifications();
  const t = await getT();

  return (
    <>
      <PageHeader title={t("notifications.title")} />
      <div className="w-full max-w-3xl">
        <NotificationCenter userId={user.id} initial={notifications} />
      </div>
    </>
  );
}
