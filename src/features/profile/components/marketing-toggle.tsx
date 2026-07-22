"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/provider";
import { setMarketingOptIn } from "../actions";

/** Optimistic marketing-email opt-in switch (writes profiles.marketing_opt_in). */
export function MarketingToggle({ initial }: { initial: boolean }) {
  const t = useT();
  const [on, setOn] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle(next: boolean) {
    setOn(next); // optimistic
    setPending(true);
    const res = await setMarketingOptIn(next);
    setPending(false);
    if (!res.ok) setOn(!next); // revert on failure
  }

  return (
    <Switch
      checked={on}
      disabled={pending}
      onChange={toggle}
      aria-label={t("profile.marketingLabel")}
    />
  );
}
