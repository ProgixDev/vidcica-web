import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToLedgerEntry, type CreditLedgerEntry } from "@/lib/vidcica/credit-ledger";

const LEDGER_COLUMNS = "id, delta, reason, video_id, created_at";

/**
 * The signed-in user's credit movements (RLS read-own via the
 * `credit_ledger read own` policy), newest first. Append-only audit trail —
 * defaults to the most recent 50 entries.
 */
export async function listMyCreditLedger(limit = 50): Promise<CreditLedgerEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_ledger")
    .select(LEDGER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => rowToLedgerEntry(r as Parameters<typeof rowToLedgerEntry>[0]));
}
