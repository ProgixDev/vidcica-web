/**
 * Support-ticket domain: type + row mapper + status metadata. Ported from
 * ClipFlow `SupportTicket` entity + the contact screen's status tone/label
 * helpers. The `support_tickets.status` column is a free-form string in the
 * DB, so `ticketStatus()` normalises it to a known key + tone. (Kept separate
 * from `support.ts`, which is the Lia chat client.)
 */
import type { Database } from "@/lib/supabase/database.types";
import type { MessageKey } from "@/lib/i18n";

export type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

export type SupportTicketStatus = "open" | "pending" | "resolved";

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
};

/** Normalise the free-form DB status string to a known status (unknown → open). */
export function ticketStatus(raw: string): SupportTicketStatus {
  return raw === "resolved" || raw === "pending" ? raw : "open";
}

export function rowToSupportTicket(r: SupportTicketRow): SupportTicket {
  return {
    id: r.id,
    subject: r.subject,
    message: r.message,
    status: ticketStatus(r.status),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Badge variant + label key per status (mirrors the mobile contact screen). */
export const TICKET_STATUS_META: Record<
  SupportTicketStatus,
  { variant: "brand" | "warning" | "success"; labelKey: MessageKey }
> = {
  open: { variant: "brand", labelKey: "help.tickets.status.open" },
  pending: { variant: "warning", labelKey: "help.tickets.status.pending" },
  resolved: { variant: "success", labelKey: "help.tickets.status.resolved" },
};
