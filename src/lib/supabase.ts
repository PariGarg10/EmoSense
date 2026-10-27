import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseUrl } from "@/src/lib/supabaseEnv";

let browserClient: SupabaseClient | null = null;

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

/**
 * Finish an email link (confirmation, magic link, password recovery) by
 * exchanging the `?code=` or `#access_token` in the URL for a session.
 */
export async function establishSessionFromUrl(
  supabase: SupabaseClient,
): Promise<{ error: string | null }> {
  const params = new URLSearchParams(window.location.search);
  const errorDescription =
    params.get("error_description") ??
    new URLSearchParams(window.location.hash.replace(/^#/, "")).get("error_description");
  if (errorDescription) return { error: errorDescription };

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return { error: error?.message ?? null };
  }

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    // Drop tokens from the address bar and history.
    window.history.replaceState(null, "", window.location.pathname);
    return { error: error?.message ?? null };
  }

  const { data } = await supabase.auth.getSession();
  return { error: data.session ? null : "This link is invalid or has expired." };
}
