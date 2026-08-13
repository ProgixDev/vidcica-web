"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; message: string };

// A browser PushSubscription, flattened. `endpoint` is the delivery URL (the PK);
// p256dh/auth are the ECDH public key + auth secret the server encrypts payloads
// with. All are safe to store (they only let THIS server push to THIS browser).
const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(512),
  auth: z.string().min(1).max(512),
  userAgent: z.string().max(512).optional(),
});

export type WebPushSubscriptionInput = z.infer<typeof SubscriptionSchema>;

/** Store (or refresh) the caller's browser push subscription. Upsert on endpoint
 *  so re-subscribing the same browser is idempotent; RLS + the explicit user_id
 *  scope the row to the caller. */
export async function saveWebPushSubscription(
  input: WebPushSubscriptionInput,
): Promise<ActionResult> {
  const parsed = SubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Abonnement invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée." };

  const { error } = await supabase.from("web_push_subscriptions").upsert(
    {
      endpoint: parsed.data.endpoint,
      user_id: user.id,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      user_agent: parsed.data.userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, message: "Impossible d'activer les notifications." };
  return { ok: true };
}

/** Remove the caller's subscription for a given endpoint (on disable / unsubscribe).
 *  RLS restricts the delete to the caller's own row. */
export async function deleteWebPushSubscription(endpoint: string): Promise<ActionResult> {
  const parsed = z.string().url().max(2048).safeParse(endpoint);
  if (!parsed.success) return { ok: false, message: "Abonnement invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée." };

  const { error } = await supabase
    .from("web_push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data);
  if (error) return { ok: false, message: "Impossible de désactiver les notifications." };
  return { ok: true };
}
