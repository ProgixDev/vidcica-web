/**
 * Shared Vidcica lead domain type + row mappers (ADR-0008). A web-native subset of
 * the mobile `Lead` entity + `rowToLead`/`leadToRow` (ClipFlow/src/lib/db-mappers.ts)
 * and the `leads.store` interaction helpers. Leads are captured server-side (Meta
 * Lead Ads → INSERT → realtime); the web reads + manages them.
 */
import type { Database } from "@/lib/supabase/database.types";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "rejected";
export type LeadScoreBucket = "hot" | "warm" | "cold";
export type ContactKind = "call" | "email" | "whatsapp";
export type InteractionKind = ContactKind | "status_change" | "note" | "export";

export type LeadInteraction = {
  id: string;
  at: string;
  kind: InteractionKind;
  message: string;
  toStatus?: LeadStatus;
};

export type LeadNote = { id: string; at: string; body: string };

export type Lead = {
  id: string;
  campaignId: string;
  campaignName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  capturedAt: string;
  score: number;
  scoreBucket: LeadScoreBucket;
  status: LeadStatus;
  notes: LeadNote[];
  interactions: LeadInteraction[];
};

/** Pure row → domain mapper. Only own rows reach here (RLS `user_id = auth.uid()`). */
export function rowToLead(r: LeadRow): Lead {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    campaignName: r.campaign_name,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    city: r.city ?? undefined,
    capturedAt: r.captured_at,
    score: r.score,
    scoreBucket: r.score_bucket as LeadScoreBucket,
    status: r.status as LeadStatus,
    notes: (r.notes as LeadNote[] | null) ?? [],
    interactions: (r.interactions as LeadInteraction[] | null) ?? [],
  };
}

/** Pure domain → row mapper for the whole-row upsert (nested arrays are JSONB). */
export function leadToRow(l: Lead, userId: string): LeadInsert {
  return {
    id: l.id,
    user_id: userId,
    campaign_id: l.campaignId,
    campaign_name: l.campaignName,
    first_name: l.firstName,
    last_name: l.lastName,
    email: l.email,
    phone: l.phone,
    city: l.city ?? null,
    captured_at: l.capturedAt,
    score: l.score,
    score_bucket: l.scoreBucket,
    status: l.status,
    notes: l.notes as unknown as LeadInsert["notes"],
    interactions: l.interactions as unknown as LeadInsert["interactions"],
  };
}

/** Append an interaction (id + at supplied by the caller — keeps this pure/testable). */
export function pushInteraction(
  list: readonly LeadInteraction[],
  next: Omit<LeadInteraction, "id" | "at">,
  id: string,
  at: string,
): LeadInteraction[] {
  return [...list, { id, at, ...next }];
}

const CSV_HEADER = [
  "Prénom",
  "Nom",
  "Email",
  "Téléphone",
  "Ville",
  "Statut",
  "Score",
  "Campagne",
  "Capturé le",
];

/** Escape a CSV cell (RFC-4180: quote + double inner quotes when needed). */
function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Serialize leads to a CSV string (header + one row per lead). Pure — unit-tested. */
export function toCsv(leads: readonly Lead[]): string {
  const rows = leads.map((l) =>
    [
      l.firstName,
      l.lastName,
      l.email,
      l.phone,
      l.city ?? "",
      STATUS_META[l.status].label,
      String(l.score),
      l.campaignName,
      l.capturedAt,
    ]
      .map(cell)
      .join(","),
  );
  return [CSV_HEADER.join(","), ...rows].join("\n");
}

/** Status pipeline order + presentation. */
export const STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "rejected",
];

export const STATUS_META: Record<
  LeadStatus,
  { label: string; variant: "muted" | "brand" | "success" | "warning" | "outline" }
> = {
  new: { label: "Nouveau", variant: "brand" },
  contacted: { label: "Contacté", variant: "warning" },
  qualified: { label: "Qualifié", variant: "warning" },
  converted: { label: "Converti", variant: "success" },
  rejected: { label: "Rejeté", variant: "outline" },
};

export const SCORE_META: Record<
  LeadScoreBucket,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  hot: { label: "Chaud", variant: "success" },
  warm: { label: "Tiède", variant: "warning" },
  cold: { label: "Froid", variant: "muted" },
};
