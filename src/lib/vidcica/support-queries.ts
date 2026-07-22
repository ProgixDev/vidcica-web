import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToSupportTicket, type SupportTicket } from "@/lib/vidcica/support-ticket";

const TICKET_COLUMNS = "id, subject, message, status, created_at, updated_at";

/** The signed-in user's past support tickets, newest first (RLS read-own). */
export async function listMyTickets(): Promise<SupportTicket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => rowToSupportTicket(r as Parameters<typeof rowToSupportTicket>[0]));
}
