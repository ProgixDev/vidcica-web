"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";

/**
 * Landing header CTA — «Commencer» for visitors, «Ouvrir l’app» when a session
 * already exists. SSR renders the visitor variant (the page stays static);
 * the session check swaps the label after hydration.
 */
export function HeaderCta() {
  const t = useT();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
    });
  }, []);

  return authed ? (
    <Link
      href="/dashboard"
      className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}
      data-testid="header-cta-app"
    >
      {t("landing.headerCta.openApp")}
    </Link>
  ) : (
    <Link href="/sign-in" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}>
      {t("landing.headerCta.start")}
    </Link>
  );
}
