"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const RowId = z.string().uuid();

type NetworkUpdate = Database["public"]["Tables"]["networks"]["Update"];
type ActionResult = { ok: true } | { ok: false; message: string };

async function updateOwnNetwork(rowId: string, patch: NetworkUpdate): Promise<ActionResult> {
  const parsed = RowId.safeParse(rowId);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide" };
  const supabase = await createClient();
  // RLS restricts the update to the caller's own row.
  const { error } = await supabase.from("networks").update(patch).eq("id", parsed.data);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/** Disconnect an account (keeps the row; clears connected + publish). */
export async function disconnectNetwork(rowId: string): Promise<ActionResult> {
  return updateOwnNetwork(rowId, {
    connected: false,
    publishes_enabled: false,
    last_sync: null,
  });
}

/** Toggle whether a connected account is included in publishing. */
export async function setNetworkPublish(rowId: string, enabled: boolean): Promise<ActionResult> {
  if (typeof enabled !== "boolean") return { ok: false, message: "Valeur invalide" };
  return updateOwnNetwork(rowId, { publishes_enabled: enabled });
}
