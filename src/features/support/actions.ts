"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const TicketInput = z.object({
  subject: z.string().trim().min(3, "Sujet trop court").max(200),
  message: z.string().trim().min(10, "Message trop court (10 caractères min)").max(5000),
});

export type SubmitTicketResult = { ok: true } | { ok: false; message: string };

/** File a support ticket (RLS insert-own into support_tickets). user_id is set
 *  server-side from the session, never from the client. */
export async function submitTicket(input: {
  subject: string;
  message: string;
}): Promise<SubmitTicketResult> {
  const parsed = TicketInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Session expirée. Reconnectez-vous." };

  const { error } = await supabase.from("support_tickets").insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "open",
  });
  if (error) return { ok: false, message: "Impossible d’envoyer votre message. Réessayez." };
  return { ok: true };
}
