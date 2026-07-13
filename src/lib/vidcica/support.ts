/**
 * Web client for the support assistant ("Lia"). `askSupport` calls the existing
 * `support-chat` edge function; a non-ok outcome (503 not-configured / error)
 * degrades to `fallbackReply()` so the chat never dead-ends — mirrors
 * ClipFlow/src/lib/support-chat.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;
const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

export type SupportTurn = { role: "user" | "assistant"; content: string };
export type SupportReply = { reply: string; suggestions: string[]; handoff: boolean };

export type AskSupportOutcome =
  | ({ ok: true } & SupportReply)
  | { ok: false; reason: "not_configured" | "unauthenticated" | "error"; message?: string };

/** The chip that routes to the contact form (the chat maps it to a handoff). */
export const CONTACT_SUGGESTION = "Ouvrir le formulaire de contact";

/** Canned reply when the assistant is unavailable — points to the contact form. */
export function fallbackReply(): SupportReply {
  return {
    reply:
      "Je ne peux pas répondre pour le moment. Vous pouvez contacter notre équipe via le formulaire de contact.",
    suggestions: [CONTACT_SUGGESTION],
    handoff: true,
  };
}

export async function askSupport(
  supabase: DB,
  turns: SupportTurn[],
  locale: "fr" | "en" = "fr",
): Promise<AskSupportOutcome> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, reason: "unauthenticated" };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/support-chat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: turns, locale }),
    });
    if (res.status === 503) return { ok: false, reason: "not_configured" };
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reply?: string;
      suggestions?: string[];
      handoff?: boolean;
      error?: string;
    };
    if (!res.ok || !body.ok || !body.reply) {
      return { ok: false, reason: "error", message: body.error ?? `HTTP ${res.status}` };
    }
    return {
      ok: true,
      reply: body.reply,
      suggestions: Array.isArray(body.suggestions) ? body.suggestions : [],
      handoff: body.handoff === true,
    };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}
