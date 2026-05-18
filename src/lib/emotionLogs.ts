import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getTheme } from "@/src/lib/emotionTheme";

export type EmotionLogRow = {
  id: string;
  user_id: string;
  logged_at: string;
  emotion: string;
  confidence: number | null;
  source: "scan" | "manual";
  note: string | null;
};

export async function fetchLastEmotionLog(
  userId: string,
): Promise<EmotionLogRow | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("emotion_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EmotionLogRow;
}

export async function fetchRecentEmotionLogs(
  userId: string,
  limit = 5,
): Promise<EmotionLogRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("emotion_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as EmotionLogRow[];
}

export async function fetchTodayMoodLog(
  userId: string,
): Promise<EmotionLogRow | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("emotion_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString())
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EmotionLogRow;
}

export async function fetchLastScanLog(
  userId: string,
): Promise<EmotionLogRow | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("emotion_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("source", "scan")
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EmotionLogRow;
}

export async function insertEmotionLog(input: {
  userId: string;
  emotion: string;
  source: "scan" | "manual";
  confidence?: number;
  note?: string;
}): Promise<EmotionLogRow | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const label = getTheme(input.emotion).label;

  const { data, error } = await supabase
    .from("emotion_logs")
    .insert({
      user_id: input.userId,
      emotion: label,
      source: input.source,
      confidence: input.confidence ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as EmotionLogRow;
}

export function computeStreakFromLogs(logs: EmotionLogRow[]): number {
  if (logs.length === 0) return 0;

  const dayKeys = new Set(
    logs.map((l) => {
      const d = new Date(l.logged_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!dayKeys.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function fetchStreakLogs(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return 0;

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const { data, error } = await supabase
    .from("emotion_logs")
    .select("logged_at")
    .eq("user_id", userId)
    .gte("logged_at", since.toISOString())
    .order("logged_at", { ascending: false });

  if (error || !data?.length) return 0;
  return computeStreakFromLogs(data as EmotionLogRow[]);
}
