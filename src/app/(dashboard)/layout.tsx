"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardShell from "@/src/components/layout/DashboardShell";
import { ensureProfile } from "@/src/lib/authProfile";
import { resolveSession } from "@/src/lib/authGate";
import { getSession } from "@/src/lib/sessionAuth";
import { loadSupabase } from "@/src/lib/supabaseEnv";
import { useEmoSenseStore } from "@/lib/store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useEmoSenseStore((s) => s.setUser);
  const setUserRole = useEmoSenseStore((s) => s.setUserRole);
  // Render immediately when a non-cloud session is already known; cloud
  // sessions still render optimistically and are confirmed below.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const loginUrl = `/login?next=${encodeURIComponent(pathname || "/dashboard")}`;

    const known = getSession();
    if (known) {
      setUser({ id: known.id, email: known.email, displayName: known.displayName });
      setReady(true);
    }

    void resolveSession().then(async (session) => {
      if (!active) return;
      if (!session) {
        router.replace(loginUrl);
        return;
      }
      const store = useEmoSenseStore.getState();
      if (store.user?.id && store.user.id !== session.id) store.resetUserData();
      setUser({ id: session.id, email: session.email, displayName: session.displayName });
      setReady(true);

      if (session.kind === "supabase") {
        const supabase = await loadSupabase();
        if (!supabase) return;
        try {
          const { data } = await supabase.auth.getUser();
          if (!active || !data.user) return;
          const profile = await ensureProfile(supabase, data.user);
          if (!active) return;
          setUserRole(profile.role);
          if (profile.displayName) {
            setUser({ id: session.id, email: session.email, displayName: profile.displayName });
          }
        } catch {
          /* profile is optional */
        }
      }
    });

    let unsubscribe: (() => void) | undefined;
    if (getSession()?.kind === "supabase") {
      void loadSupabase().then((supabase) => {
        if (!active || !supabase) return;
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT" && getSession()?.kind === "supabase") {
            router.replace("/login");
          }
        });
        unsubscribe = () => data.subscription.unsubscribe();
      });
    }

    // Sign-out in another tab removes the shared session key.
    function onStorage(e: StorageEvent) {
      if (e.key === "emosense-session" && !e.newValue) router.replace("/login");
    }
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      unsubscribe?.();
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]"
        role="status"
      >
        <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent-primary)]" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
