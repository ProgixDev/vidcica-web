import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyNotifications } from "@/lib/vidcica/notifications-queries";
import { NotificationCenter } from "@/features/notifications";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/notifications");

  const notifications = await listMyNotifications();

  return (
    <>
      <PageHeader title="Notifications" />
      <div className="w-full max-w-3xl">
        <NotificationCenter userId={user.id} initial={notifications} />
      </div>
    </>
  );
}
