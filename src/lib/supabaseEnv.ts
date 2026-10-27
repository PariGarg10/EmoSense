import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Env checks and a lazy loader, kept free of the supabase-js import so demo
 * and device-only sessions never download the Supabase SDK.
 */

function projectRefFromAnonKey(key: string): string | null {
  try {
    const payload = key.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.ref === "string" ? json.ref : null;
  } catch {
    return null;
  }
}

export function resolveSupabaseUrl(rawUrl: string | undefined, anonKey: string): string | null {
  const ref = projectRefFromAnonKey(anonKey);
  const expected = ref ? `https://${ref}.supabase.co` : null;

  const trimmed = rawUrl?.trim() ?? "";
  if (trimmed.startsWith("https://") && trimmed.includes(".supabase.co")) {
    const normalized = trimmed.replace(/\/$/, "");
    if (expected && normalized !== expected) {
      console.warn(
        `[EmoSense] NEXT_PUBLIC_SUPABASE_URL does not match anon key project ref. Using ${expected}`,
      );
      return expected;
    }
    return normalized;
  }

  return expected;
}

/** True when cloud accounts are configured for this deployment. */
export function isSupabaseConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(key && resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, key));
}

/** Load the Supabase client on demand; null when not configured. */
export async function loadSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const { createClient } = await import("@/src/lib/supabase");
  return createClient();
}
