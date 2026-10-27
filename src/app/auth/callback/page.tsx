"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeSignIn, sessionFromSupabaseUser } from "@/src/lib/authGate";
import { createClient, establishSessionFromUrl } from "@/src/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Sign-in is not configured.");
      router.replace("/login");
      return;
    }

    let active = true;
    void (async () => {
      const { error } = await establishSessionFromUrl(supabase);
      if (!active) return;
      const { data } = await supabase.auth.getUser();
      if (error || !data.user) {
        setMessage(error ?? "Could not sign you in.");
        window.setTimeout(() => router.replace("/login"), 2000);
        return;
      }
      completeSignIn(sessionFromSupabaseUser(data.user));
      window.location.replace("/dashboard");
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <p className="text-[var(--text-secondary)]" role="status">
        {message}
      </p>
    </main>
  );
}
