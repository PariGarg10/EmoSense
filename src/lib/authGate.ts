/**
 * Single place to decide if the user may access dashboard routes.
 */

import { useEmoSenseStore } from "@/lib/store";
import {
  getAuthKind,
  getLocalSession,
  isDemoSession,
  isSupabaseSessionActive,
  setAuthKind,
  type AuthKind,
} from "@/src/lib/sessionAuth";

export function markSignedIn(kind: AuthKind): void {
  setAuthKind(kind);
}

/** True if this browser tab has an active EmoSense session. */
export function canAccessDashboard(): boolean {
  const kind = getAuthKind();
  if (kind === "demo" && isDemoSession()) return true;
  if (kind === "local" && getLocalSession()) return true;
  if (kind === "supabase" && isSupabaseSessionActive()) return true;

  // Legacy / recovery paths
  if (isDemoSession()) return true;
  if (getLocalSession()) return true;
  if (isSupabaseSessionActive()) return true;

  const user = useEmoSenseStore.getState().user;
  return Boolean(user?.id);
}

export function goToDashboard(): void {
  if (typeof window !== "undefined") {
    window.location.assign("/dashboard");
    return;
  }
}
