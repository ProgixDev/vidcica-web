"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RowId = z.string().uuid();

type ActionResult = { ok: true } | { ok: false; message: string };

function nowIso(): string {
  // Server-set timestamp; the DB `updated_at` trigger also stamps.
  return new Date().toISOString();
}

/** Mark one notification read (RLS restricts to the caller's own row). */
export async function markRead(id: string): Promise<ActionResult> {
  const parsed = RowId.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: nowIso() })
    .eq("id", parsed.data)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Notification introuvable" };
  return { ok: true };
}

/** Mark all of the caller's unread notifications read. */
export async function markAllRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: nowIso() })
    .eq("read", false);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
