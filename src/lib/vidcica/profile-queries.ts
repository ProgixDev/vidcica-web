import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToProfile, type Profile } from "@/lib/vidcica/profile";

/** The signed-in user's profile row (RLS read-own), or null if not provisioned. */
export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, display_name, niche, audience, avatar_url, preferred_tone, marketing_opt_in, created_at",
    )
    .maybeSingle();
  return data ? rowToProfile(data as Parameters<typeof rowToProfile>[0]) : null;
}
