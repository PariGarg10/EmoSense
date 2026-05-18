"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/src/components/layout/DashboardShell";
import { ensureProfile } from "@/src/lib/authProfile";
import { createClient } from "@/src/lib/supabase";
import { demoUser, getLocalSession, isDemoSession } from "@/src/lib/sessionAuth";
import { useEmoSenseStore } from "@/lib/store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setUser = useEmoSenseStore((s) => s.setUser);
  const setUserRole = useEmoSenseStore((s) => s.setUserRole);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    function allowDemoOrLocal() {
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
      return false;
    }

    if (allowDemoOrLocal()) {
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      const profile = await ensureProfile(supabase, session.user);
      setUser({
        id: session.user.id,
        email: session.user.email,
        displayName: profile.displayName ?? undefined,
      });
      setUserRole(profile.role);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setReady(true);
        return;
      }
      if (isDemoSession() || getLocalSession()) return;
      if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
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
