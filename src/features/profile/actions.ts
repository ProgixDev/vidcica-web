"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; message: string };

const ProfileInput = z.object({
  displayName: z.string().trim().max(60),
  niche: z.string().trim().max(40),
  audience: z.string().trim().max(280),
  preferredTone: z.string().trim().max(30),
});

export type ProfileInput = z.infer<typeof ProfileInput>;

/** Update the caller's own profile (RLS `id = auth.uid()`). Empty strings clear
 *  the field (stored as null). */
export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = ProfileInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Champs invalides" };
  const { displayName, niche, audience, preferredTone } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée" };

  // Empty strings clear the field (the mappers + UI treat "" as unset). The
  // generated Update type is non-nullable, so we store "" rather than null.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      niche: niche,
      audience: audience,
      preferred_tone: preferredTone,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/account");
  return { ok: true };
}

/** Persist a freshly-uploaded avatar public URL on the caller's profile. The
 *  file is uploaded to the public `avatars` bucket from the browser first; this
 *  only stores the resulting public URL (RLS `id = auth.uid()`). */
const AvatarInput = z.object({ avatarUrl: z.string().trim().url().max(2048) });

export async function setAvatar(avatarUrl: string): Promise<ActionResult> {
  const parsed = AvatarInput.safeParse({ avatarUrl });
  if (!parsed.success) return { ok: false, message: "URL invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: parsed.data.avatarUrl })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/account");
  return { ok: true };
}

/** Toggle marketing e-mail opt-in on the caller's profile. */
export async function setMarketingOptIn(enabled: boolean): Promise<ActionResult> {
  if (typeof enabled !== "boolean") return { ok: false, message: "Valeur invalide" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée" };

  const { error } = await supabase
    .from("profiles")
    .update({ marketing_opt_in: enabled })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
