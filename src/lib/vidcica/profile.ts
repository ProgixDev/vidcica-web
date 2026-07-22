/**
 * Shared Vidcica profile domain type + row mapper (ADR-0008). A web-native
 * subset of the mobile `profiles` row — the fields the account/profile surface
 * renders. RLS scopes reads to the caller's own row (`id = auth.uid()`).
 */
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type Profile = {
  id: string;
  displayName?: string;
  niche?: string;
  audience?: string;
  avatarUrl?: string;
  preferredTone?: string;
  marketingOptIn: boolean;
  createdAt: string;
};

export function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    displayName: r.display_name ?? undefined,
    niche: r.niche ?? undefined,
    audience: r.audience ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    preferredTone: r.preferred_tone ?? undefined,
    marketingOptIn: r.marketing_opt_in ?? false,
    createdAt: r.created_at,
  };
}

/** First name for greetings; falls back to the email local-part or a generic. */
export function firstName(p: Pick<Profile, "displayName"> | null, email?: string | null): string {
  const dn = p?.displayName?.trim();
  if (dn) return dn.split(/\s+/)[0] ?? dn;
  const local = email?.split("@")[0];
  return local ?? "";
}
