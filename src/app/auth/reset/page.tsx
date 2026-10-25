"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { completeSignIn, sessionFromSupabaseUser } from "@/src/lib/authGate";
import { validatePassword } from "@/src/lib/sessionAuth";
import { createClient, establishSessionFromUrl } from "@/src/lib/supabase";

const inputClass =
  "mt-2 min-h-[48px] w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-black placeholder:text-neutral-500";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStatus("invalid");
      setError("Password reset is not configured.");
      return;
    }
    void establishSessionFromUrl(supabase).then(({ error: linkError }) => {
      if (linkError) {
        setStatus("invalid");
        setError(linkError);
      } else {
        setStatus("ready");
      }
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = validatePassword(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError("The two passwords do not match.");

    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError || !data.user) {
      setError(updateError?.message ?? "Could not update your password.");
      return;
    }
    completeSignIn(sessionFromSupabaseUser(data.user));
    setStatus("done");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] p-8 shadow-lg">
        <p className="font-display text-2xl font-bold text-[var(--accent-primary)]">EmoSense</p>
        <h1 className="mt-6 font-display text-2xl font-bold text-[var(--text-primary)]">
          Choose a new password
        </h1>

        {status === "checking" && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]" role="status">
            Checking your link…
          </p>
        )}

        {status === "invalid" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[#E07B7B]" role="alert">
              {error}
            </p>
            <Link href="/login" className="text-sm text-[var(--accent-primary)] underline">
              Back to sign in
            </Link>
          </div>
        )}

        {status === "done" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[var(--accent-soft)]" role="status">
              Your password was updated.
            </p>
            <Button type="button" className="w-full" onClick={() => window.location.replace("/dashboard")}>
              Go to dashboard
            </Button>
          </div>
        )}

        {status === "ready" && (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm text-[var(--text-secondary)]">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm text-[var(--text-secondary)]">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </label>
            {error && (
              <p className="text-sm text-[#E07B7B]" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
