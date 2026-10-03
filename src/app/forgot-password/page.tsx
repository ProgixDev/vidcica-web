import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/features/auth";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("auth.forgotMetaTitle") };
}

/** Password-recovery request page — enter your e-mail, get a reset link. */
export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="bg-background flex min-h-dvh w-full flex-col px-6 py-5 sm:px-10">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/"
          className="focus-visible:ring-ring focus-visible:ring-offset-background rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <BrandLockup />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center py-12">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
