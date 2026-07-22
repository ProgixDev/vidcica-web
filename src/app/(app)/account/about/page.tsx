import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/app-shell";
import { ProfileSection, ProfileLinkRow } from "@/features/profile";

const APP_VERSION = "1.0.0";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("about.metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/about");

  const t = await getT();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <PageHeader
        title={t("about.title")}
        actions={
          <Link href="/account" className="text-muted-foreground hover:text-foreground text-sm">
            ← {t("common.back")}
          </Link>
        }
      />

      {/* App identity */}
      <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border p-6 text-center">
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full text-2xl font-bold"
        >
          V
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Vidcica</h2>
        <p className="text-muted-foreground text-xs">
          {t("about.version", { version: APP_VERSION })}
        </p>
        <p className="text-muted-foreground max-w-xs text-sm">{t("about.tagline")}</p>
      </div>

      {/* Legal + support links */}
      <ProfileSection title={t("about.sectionLinks")}>
        <ProfileLinkRow href="/support" label={t("about.rowSupport")} testId="about-support-link" />
        <ProfileLinkRow href="/terms" label={t("profile.rowTerms")} testId="about-terms-link" />
        <ProfileLinkRow
          href="/privacy"
          label={t("profile.rowPrivacy")}
          testId="about-privacy-link"
        />
        <ProfileLinkRow
          href="/mentions-legales"
          label={t("profile.rowLegalNotice")}
          testId="about-legal-link"
        />
      </ProfileSection>
    </div>
  );
}
