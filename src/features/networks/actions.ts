"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { entityId as RowId } from "@/lib/vidcica/id";
import type { Database } from "@/lib/supabase/database.types";

type NetworkUpdate = Database["public"]["Tables"]["networks"]["Update"];
type ActionResult = { ok: true } | { ok: false; message: string };

type EdgeAnswer = { status: number; body: Record<string, unknown> };

/** Call an edge function as the signed-in user. A non-2xx answer still carries
 *  its JSON body (the reason codes the UI maps), so read it from the error. */
async function invokeAsUser(fn: string, body: Record<string, unknown>): Promise<EdgeAnswer> {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (!error) return { status: 200, body: (data ?? {}) as Record<string, unknown> };
  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } }).context;
  if (ctx && typeof ctx.status === "number") {
    const raw = ctx.json ? await ctx.json().catch(() => ({})) : {};
    const parsed = z.record(z.string(), z.unknown()).safeParse(raw);
    return { status: ctx.status, body: parsed.success ? parsed.data : {} };
  }
  return { status: 0, body: { error: "network_error" } };
}

const PageId = z.string().regex(/^[0-9]{1,30}$/);

export type SelectPageResult = { ok: true } | { ok: false; reason: string };

/**
 * Choose the Facebook Page Vidcica posts to and advertises from. The server
 * (`meta-select-page`) checks the Page against what the token can post to now,
 * then updates both Meta rows (and the Instagram row's connection) together.
 */
export async function selectMetaPage(pageId: string): Promise<SelectPageResult> {
  const parsed = PageId.safeParse(pageId);
  if (!parsed.success) return { ok: false, reason: "page_unavailable" };
  const res = await invokeAsUser("meta-select-page", { pageId: parsed.data });
  if (res.body.ok === true) return { ok: true };
  return { ok: false, reason: typeof res.body.error === "string" ? res.body.error : "error" };
}

export type MetaDisconnectResult =
  | { ok: true; stillRunning: number; adsManagerUrl: string | null }
  | { ok: false; reason: "pause_failed"; campaigns: string[]; adsManagerUrl: string | null }
  | { ok: false; reason: string };

/**
 * Disconnect Facebook AND Instagram (one Meta login). `meta-disconnect` pauses
 * the person's running Boosts first: once the token is gone Vidcica can't stop
 * them. If a pause fails nothing is disconnected (`pause_failed`) unless the
 * person confirms with `force`.
 */
export async function disconnectMeta(force = false): Promise<MetaDisconnectResult> {
  const res = await invokeAsUser("meta-disconnect", { force: force === true });
  const url = typeof res.body.adsManagerUrl === "string" ? res.body.adsManagerUrl : null;
  if (res.body.ok === true) {
    const stillRunning = typeof res.body.stillRunning === "number" ? res.body.stillRunning : 0;
    return { ok: true, stillRunning, adsManagerUrl: url };
  }
  if (res.body.error === "pause_failed") {
    const list = Array.isArray(res.body.campaigns) ? res.body.campaigns : [];
    const campaigns = list
      .map((c) => (c && typeof c === "object" ? String((c as { name?: unknown }).name ?? "") : ""))
      .filter(Boolean);
    return { ok: false, reason: "pause_failed", campaigns, adsManagerUrl: url };
  }
  return { ok: false, reason: typeof res.body.error === "string" ? res.body.error : "error" };
}

async function updateOwnNetwork(rowId: string, patch: NetworkUpdate): Promise<ActionResult> {
  const parsed = RowId.safeParse(rowId);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide" };
  const supabase = await createClient();
  // RLS restricts the update to the caller's own row. `.select` lets us tell a
  // real update from a zero-row match (someone else's / stale id) — RLS blocks
  // the write either way, but we shouldn't report success on a no-op.
  const { data, error } = await supabase
    .from("networks")
    .update(patch)
    .eq("id", parsed.data)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Réseau introuvable" };
  return { ok: true };
}

/** Disconnect an account (keeps the row; clears connected + publish). The
 *  database trigger networks_drop_tokens_on_disconnect (vidcica migration
 *  20261005092829) deletes the stored tokens on this update, so a disconnect
 *  ends our access to the account, not just its display. */
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
