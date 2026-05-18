"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import DashboardShell from "@/src/components/layout/DashboardShell";
import { canAccessDashboard } from "@/src/lib/authGate";
import { ensureProfile } from "@/src/lib/authProfile";
import {
  demoUser,
  getAuthKind,
  getLocalSession,
  isDemoSession,
  isSupabaseSessionActive,
} from "@/src/lib/sessionAuth";
import { createClient } from "@/src/lib/supabase";
import { useEmoSenseStore } from "@/lib/store";

function displayNameFromUser(user: User): string | undefined {
  const meta = user.user_metadata?.display_name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  return user.email?.split("@")[0];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setUser = useEmoSenseStore((s) => s.setUser);
  const setUserRole = useEmoSenseStore((s) => s.setUserRole);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    function allowFromBrowserSession(): boolean {
      if (!canAccessDashboard()) return false;

      if (isDemoSession()) {
        const u = demoUser();
        setUser({ id: u.id, email: u.email, displayName: u.displayName });
        setUserRole("user");
        setReady(true);
        return true;
      }

      const local = getLocalSession();
      if (local) {
        setUser({
          id: local.id,
          email: local.email,
          displayName: local.displayName,
        });
        setUserRole("user");
        setReady(true);
        return true;
      }

      const storeUser = useEmoSenseStore.getState().user;
      if (storeUser?.id) {
        setReady(true);
        return true;
      }

      if (isSupabaseSessionActive() || getAuthKind() === "supabase") {
        setReady(true);
        return true;
      }

      return false;
    }

    if (allowFromBrowserSession()) {
      const kind = getAuthKind();
      if (kind === "supabase") {
        const supabase = createClient();
        if (supabase) {
          void supabase.auth.getSession().then(({ data: { session } }) => {
            if (!active || !session?.user) return;
            void ensureProfile(supabase, session.user).then((profile) => {
              if (!active) return;
              setUser({
                id: session.user.id,
                email: session.user.email,
                displayName: profile.displayName ?? displayNameFromUser(session.user),
              });
              setUserRole(profile.role);
            });
          });
        }
      }
      return () => {
        active = false;
      };
    }

    const supabase = createClient();
    if (!supabase) {
      router.replace("/login");
      return () => {
        active = false;
      };
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          displayName: displayNameFromUser(session.user),
        });
        setUserRole("user");
        setReady(true);
        try {
          const profile = await ensureProfile(supabase, session.user);
          if (!active) return;
          setUserRole(profile.role);
        } catch {
          /* optional */
        }
        return;
      }
      router.replace("/login");
    });

    return () => {
      active = false;
    };
  }, [router, setUser, setUserRole]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] text-[var(--text-secondary)]">
        <p className="font-body text-sm">Loading…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
