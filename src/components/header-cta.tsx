"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Landing header CTA — «Commencer» for visitors, «Ouvrir l’app» when a session
 * already exists. SSR renders the visitor variant (the page stays static);
 * the session check swaps the label after hydration.
 */
export function HeaderCta() {
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
      Ouvrir l’app
    </Link>
  ) : (
    <Link href="/sign-in" className={cn(buttonVariants({ size: "sm" }), "rounded-full px-4")}>
      Commencer
    </Link>
  );
}
