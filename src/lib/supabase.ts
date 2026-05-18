import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

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

function resolveSupabaseUrl(rawUrl: string | undefined, anonKey: string): string | null {
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

/** Browser Supabase client; returns null when env vars are missing or invalid. */
export function createClient(): SupabaseClient | null {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) return null;

  const url = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
  if (!url) return null;

  if (!browserClient) {
    browserClient = createSupabaseClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return browserClient;
}

/** Call after env changes in dev so the singleton picks up new values. */
export function resetSupabaseClient() {
  browserClient = null;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return createClient();
}
