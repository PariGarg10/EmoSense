"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { goToDashboard, markSignedIn } from "@/src/lib/authGate";
import { createClient } from "@/src/lib/supabase";

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

    async function finish() {
      if (!supabase) return;

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setMessage(error.message);
          router.replace("/login");
          return;
        }
        markSignedIn("supabase");
        goToDashboard();
        return;
      }

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!active) return;
          if (error) {
            setMessage(error.message);
            router.replace("/login");
            return;
          }
          markSignedIn("supabase");
          goToDashboard();
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        markSignedIn("supabase");
        goToDashboard();
        return;
      }
      router.replace("/login");
    }

    finish();

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
