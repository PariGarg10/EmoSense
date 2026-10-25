/**
 * Emotion + behaviour log storage.
 *
 * Cloud (Supabase) sessions read/write Postgres; demo and device-only
 * sessions use localStorage scoped to the user id. If a cloud write fails
 * (offline, missing migration), the entry is kept locally so nothing is lost,
 * and reads merge both sources.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/src/lib/sessionAuth";
import { loadSupabase } from "@/src/lib/supabaseEnv";
import { getTheme } from "@/src/lib/emotionTheme";

export type EmotionSource = "scan" | "manual";

export type EmotionLogRow = {
  id: string;
  user_id: string;
  logged_at: string;
  emotion: string;
  confidence: number | null;
  source: EmotionSource;
  note: string | null;
};

export type BehaviourLogRow = {
  id: string;
  user_id: string;
  logged_at: string;
  time_of_day: string | null;
  emotion: string;
  activities: string[];
  energy_level: number | null;
  note: string | null;
};

type Table = "emotion_logs" | "behaviour_logs";
type RowFor<T extends Table> = T extends "emotion_logs" ? EmotionLogRow : BehaviourLogRow;

const MAX_LOCAL_ROWS = 2000;
const CACHE_TTL_MS = 60_000;
const DEFAULT_WINDOW_DAYS = 400;

/* ---------- change notifications ---------- */

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeLogs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const l of listeners) l();
}

/* ---------- cache ---------- */

const cache = new Map<string, { at: number; rows: unknown[] }>();
const inflight = new Map<string, Promise<unknown[]>>();

export function clearLogCache() {
  cache.clear();
  inflight.clear();
}

function invalidate(userId: string, table: Table) {
  cache.delete(`${table}:${userId}`);
  inflight.delete(`${table}:${userId}`);
  notify();
}

/* ---------- local storage backend ---------- */

function localKey(table: Table, userId: string) {
  return `emosense-${table}:${userId}`;
}

function readLocal<T extends Table>(table: T, userId: string): RowFor<T>[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(localKey(table, userId));
    const parsed = raw ? (JSON.parse(raw) as RowFor<T>[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal<T extends Table>(table: T, userId: string, rows: RowFor<T>[]) {
  try {
    localStorage.setItem(localKey(table, userId), JSON.stringify(rows.slice(0, MAX_LOCAL_ROWS)));
  } catch {
    /* quota exceeded or blocked; keep in-memory only */
  }
}

/* ---------- backend selection ---------- */

async function cloudClient(userId: string): Promise<SupabaseClient | null> {
  const session = getSession();
  if (session?.kind !== "supabase" || session.id !== userId) return null;
  return loadSupabase();
}

function byNewest(a: { logged_at: string }, b: { logged_at: string }) {
  return b.logged_at.localeCompare(a.logged_at);
}

async function loadAll<T extends Table>(table: T, userId: string): Promise<RowFor<T>[]> {
  const key = `${table}:${userId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows as RowFor<T>[];

  const pending = inflight.get(key);
  if (pending) return (await pending) as RowFor<T>[];

  const job = (async () => {
    const local = readLocal(table, userId);
    const supabase = await cloudClient(userId);
    let rows: RowFor<T>[] = local;

    if (supabase) {
      const since = new Date();
      since.setDate(since.getDate() - DEFAULT_WINDOW_DAYS);
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", since.toISOString())
        .order("logged_at", { ascending: false })
        .limit(MAX_LOCAL_ROWS);
      if (!error && data) {
        const remote = data as RowFor<T>[];
        const seen = new Set(remote.map((r) => r.id));
        rows = [...remote, ...local.filter((r) => !seen.has(r.id))];
      }
    }

    rows = [...rows].sort(byNewest);
    cache.set(key, { at: Date.now(), rows });
    return rows;
  })();

  inflight.set(key, job);
  try {
    return (await job) as RowFor<T>[];
  } finally {
    inflight.delete(key);
  }
}

async function insertRow<T extends Table>(
  table: T,
  userId: string,
  row: Omit<RowFor<T>, "id" | "logged_at">,
): Promise<RowFor<T>> {
  const supabase = await cloudClient(userId);
  if (supabase) {
    const { data, error } = await supabase
      .from(table)
      .insert(row as Record<string, unknown>)
      .select()
      .single();
    if (!error && data) {
      invalidate(userId, table);
      return data as RowFor<T>;
    }
    console.warn(`[EmoSense] Could not save to ${table}; keeping it on this device.`, error);
  }

  const full = {
    ...row,
    id: crypto.randomUUID(),
    logged_at: new Date().toISOString(),
  } as RowFor<T>;
  writeLocal(table, userId, [full, ...readLocal(table, userId)]);
  invalidate(userId, table);
  return full;
}

async function updateRow<T extends Table>(
  table: T,
  userId: string,
  id: string,
  patch: Partial<RowFor<T>>,
): Promise<boolean> {
  const local = readLocal(table, userId);
  const idx = local.findIndex((r) => r.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], ...patch };
    writeLocal(table, userId, local);
    invalidate(userId, table);
    return true;
  }
  const supabase = await cloudClient(userId);
  if (!supabase) return false;
  const { error } = await supabase
    .from(table)
    .update(patch as Record<string, unknown>)
    .eq("id", id)
    .eq("user_id", userId);
  invalidate(userId, table);
  return !error;
}

async function deleteRow(table: Table, userId: string, id: string): Promise<boolean> {
  const local = readLocal(table, userId);
  const next = local.filter((r) => r.id !== id);
  if (next.length !== local.length) {
    writeLocal(table, userId, next);
    invalidate(userId, table);
    return true;
  }
  const supabase = await cloudClient(userId);
  if (!supabase) return false;
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
  invalidate(userId, table);
  return !error;
}

/* ---------- query helpers ---------- */

export type RangeOptions = { from?: Date; to?: Date; limit?: number };

function filterRange<T extends { logged_at: string }>(rows: T[], opts: RangeOptions = {}): T[] {
  const from = opts.from?.toISOString();
  const to = opts.to?.toISOString();
  const out = rows.filter(
    (r) => (!from || r.logged_at >= from) && (!to || r.logged_at <= to),
  );
  return opts.limit ? out.slice(0, opts.limit) : out;
}

/* ---------- public API ---------- */

export async function listEmotionLogs(userId: string, opts?: RangeOptions) {
  return filterRange(await loadAll("emotion_logs", userId), opts);
}

export async function listBehaviourLogs(userId: string, opts?: RangeOptions) {
  return filterRange(await loadAll("behaviour_logs", userId), opts);
}

export async function addEmotionLog(input: {
  userId: string;
  emotion: string;
  source: EmotionSource;
  confidence?: number;
  note?: string;
}): Promise<EmotionLogRow> {
  return insertRow("emotion_logs", input.userId, {
    user_id: input.userId,
    emotion: getTheme(input.emotion).label,
    source: input.source,
    confidence: input.confidence ?? null,
    note: input.note?.trim() || null,
  });
}

export async function addBehaviourLog(input: {
  userId: string;
  timeOfDay: string;
  emotion: string;
  activities: string[];
  energyLevel: number;
  note?: string;
}): Promise<BehaviourLogRow> {
  return insertRow("behaviour_logs", input.userId, {
    user_id: input.userId,
    time_of_day: input.timeOfDay,
    emotion: getTheme(input.emotion).label,
    activities: input.activities,
    energy_level: input.energyLevel,
    note: input.note?.trim() || null,
  });
}

export function updateEmotionNote(userId: string, id: string, note: string) {
  return updateRow("emotion_logs", userId, id, { note: note.trim() || null });
}

export function deleteEmotionLog(userId: string, id: string) {
  return deleteRow("emotion_logs", userId, id);
}

export function deleteBehaviourLog(userId: string, id: string) {
  return deleteRow("behaviour_logs", userId, id);
}

/** Every log for export. */
export async function exportLogs(userId: string) {
  const [emotionLogs, behaviourLogs] = await Promise.all([
    loadAll("emotion_logs", userId),
    loadAll("behaviour_logs", userId),
  ]);
  return { emotionLogs, behaviourLogs };
}

/** Remove every log for this user (cloud rows too when signed in to the cloud). */
export async function deleteAllLogs(userId: string): Promise<boolean> {
  let ok = true;
  const supabase = await cloudClient(userId);
  if (supabase) {
    const results = await Promise.all([
      supabase.from("emotion_logs").delete().eq("user_id", userId),
      supabase.from("behaviour_logs").delete().eq("user_id", userId),
    ]);
    ok = results.every((r) => !r.error);
  }
  try {
    localStorage.removeItem(localKey("emotion_logs", userId));
    localStorage.removeItem(localKey("behaviour_logs", userId));
  } catch {
    /* ignore */
  }
  invalidate(userId, "emotion_logs");
  invalidate(userId, "behaviour_logs");
  return ok;
}

/* ---------- derived stats ---------- */

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Consecutive days (ending today, or yesterday if today is empty) with any log. */
export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((iso) => dayKey(new Date(iso))));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type ActivityEntry = {
  id: string;
  kind: "emotion" | "behaviour";
  logged_at: string;
  emotion: string;
  note: string | null;
  source: EmotionSource | "tracker";
  confidence: number | null;
  detail?: string;
};

export function mergeActivity(
  emotionLogs: EmotionLogRow[],
  behaviourLogs: BehaviourLogRow[],
): ActivityEntry[] {
  return [
    ...emotionLogs.map<ActivityEntry>((l) => ({
      id: l.id,
      kind: "emotion",
      logged_at: l.logged_at,
      emotion: l.emotion,
      note: l.note,
      source: l.source,
      confidence: l.confidence,
    })),
    ...behaviourLogs.map<ActivityEntry>((l) => ({
      id: l.id,
      kind: "behaviour",
      logged_at: l.logged_at,
      emotion: l.emotion,
      note: l.note,
      source: "tracker",
      confidence: null,
      detail: [
        l.time_of_day,
        l.activities?.length ? l.activities.join(", ") : null,
        l.energy_level != null ? `Energy ${l.energy_level}/5` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  ].sort(byNewest);
}
