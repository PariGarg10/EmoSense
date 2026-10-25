/**
 * Single place to decide who is signed in and to sign in / out.
 */

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useEmoSenseStore } from "@/lib/store";
import {
  clearSession,
  getSession,
  saveSession,
  type BrowserSession,
} from "@/src/lib/sessionAuth";
import { loadSupabase } from "@/src/lib/supabaseEnv";
import { clearLogCache } from "@/src/lib/logRepository";
import type { UserRole } from "@/lib/types";

export function sessionFromSupabaseUser(user: SupabaseUser): BrowserSession {
  const meta = user.user_metadata?.display_name;
  return {
    kind: "supabase",
    id: user.id,
    email: user.email,
    displayName:
      typeof meta === "string" && meta.trim() ? meta.trim() : user.email?.split("@")[0],
  };
}

/** Store the session and hydrate the app store for the signed-in user. */
export function completeSignIn(
  session: BrowserSession,
  options: { remember?: boolean; role?: UserRole } = {},
): void {
  const store = useEmoSenseStore.getState();
  if (store.user?.id && store.user.id !== session.id) {
    store.resetUserData();
  }
  saveSession(session, options.remember ?? true);
  store.setUser({ id: session.id, email: session.email, displayName: session.displayName });
  if (options.role) store.setUserRole(options.role);
}

/**
 * Resolve the active session. Cloud sessions are confirmed against
 * Supabase's stored tokens so an expired login is not trusted.
 */
export async function resolveSession(): Promise<BrowserSession | null> {
  const local = getSession();
  if (local && local.kind !== "supabase") return local;

  const supabase = await loadSupabase();
  if (!supabase) {
    if (local) clearSession();
    return null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    if (local) clearSession();
    return null;
  }
  const resolved = sessionFromSupabaseUser(session.user);
  if (!local || local.id !== resolved.id) saveSession(resolved, true);
  return local?.id === resolved.id ? { ...resolved, displayName: local.displayName ?? resolved.displayName } : resolved;
}

export async function signOut(): Promise<void> {
  const session = getSession();
  if (session?.kind === "supabase") {
    try {
      await (await loadSupabase())?.auth.signOut();
    } catch {
      /* still clear locally */
    }
  }
  clearSession();
  clearLogCache();
  const store = useEmoSenseStore.getState();
  store.resetUserData();
  store.setUser(null);
  store.setUserRole("user");
  if (typeof window !== "undefined") window.location.replace("/login");
}

/** Only allow same-origin relative redirects after sign-in. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/dashboard";
  }
  if (raw.startsWith("/login") || raw.startsWith("/auth")) return "/dashboard";
  return raw;
}
