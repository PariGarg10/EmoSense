"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import { completeSignIn, resolveSession, safeNextPath, sessionFromSupabaseUser } from "@/src/lib/authGate";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  MIN_PASSWORD_LENGTH,
  demoUser,
  hasLocalAccount,
  registerLocalAccount,
  tryDemoLogin,
  validateEmail,
  validatePassword,
  verifyLocalLogin,
} from "@/src/lib/sessionAuth";
import { isSupabaseConfigured, loadSupabase } from "@/src/lib/supabaseEnv";
import { useEmoSenseStore } from "@/lib/store";

type AuthMode = "signin" | "signup" | "forgot";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect. Try again or sign up first.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email first. Check your inbox for the link.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "This email already has an account. Use Sign in instead.";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (lower.includes("fetch") || lower.includes("network")) {
    return "Could not reach the server. Check your connection and try again.";
  }
  return message;
}

const inputClass =
  "mt-2 min-h-[48px] w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-black placeholder:text-neutral-500";

function nextPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

export default function LoginPage() {
  const addToast = useEmoSenseStore((s) => s.addToast);

  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [localOnlyAccount, setLocalOnlyAccount] = useState(true);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const failures = useRef<{ count: number; until: number }>({ count: 0, until: 0 });

  useEffect(() => {
    const cloud = isSupabaseConfigured();
    setCloudEnabled(cloud);
    setLocalOnlyAccount(!cloud);
    void resolveSession().then((session) => {
      if (session) window.location.replace(nextPath());
    });
  }, []);

  function switchMode(next: AuthMode) {
    setMode(next);
    setInlineError(null);
    setNotice(null);
    setPassword("");
  }

  function fail(message: string) {
    setLoading(false);
    setInlineError(message);
  }

  function finish(session: Parameters<typeof completeSignIn>[0]) {
    failures.current = { count: 0, until: 0 };
    completeSignIn(session, { remember });
    addToast({ variant: "success", message: "Opening your dashboard..." });
    window.location.replace(nextPath());
  }

  function lockedOut(): boolean {
    const f = failures.current;
    if (f.until > Date.now()) {
      const secs = Math.ceil((f.until - Date.now()) / 1000);
      setInlineError(`Too many attempts. Try again in ${secs} seconds.`);
      return true;
    }
    return false;
  }

  function recordFailure() {
    const f = failures.current;
    f.count += 1;
    if (f.count >= MAX_ATTEMPTS) {
      f.until = Date.now() + LOCKOUT_MS;
      f.count = 0;
    }
  }

  function enterDemo() {
    setInlineError(null);
    finish(demoUser());
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setNotice(null);
    if (lockedOut()) return;

    if (tryDemoLogin(email, password)) {
      finish(demoUser());
      return;
    }

    setLoading(true);
    if (hasLocalAccount(email)) {
      const local = await verifyLocalLogin(email, password);
      if (local) {
        finish(local);
        return;
      }
      if (!cloudEnabled) {
        recordFailure();
        fail("Email or password is incorrect.");
        return;
      }
    }

    const supabase = await loadSupabase();
    if (!supabase) {
      recordFailure();
      fail("No account found with that email on this device. Sign up, or use the demo account.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        recordFailure();
        fail(formatAuthError(error?.message ?? "Could not sign in. Please try again."));
        return;
      }
      finish(sessionFromSupabaseUser(data.user));
    } catch (err) {
      fail(formatAuthError(err instanceof Error ? err.message : "Network error"));
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setNotice(null);

    const emailError = validateEmail(email);
    if (emailError) return fail(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) return fail(passwordError);

    setLoading(true);
    if (localOnlyAccount) {
      const result = await registerLocalAccount(email, password, displayName);
      if (!result.ok) return fail(result.error);
      finish(result.session);
      return;
    }

    const supabase = await loadSupabase();
    if (!supabase) {
      return fail("Cloud sign-up is not configured. Keep “Save on this device only” checked.");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return fail(formatAuthError(error.message));

      if (data.session && data.user) {
        finish({
          ...sessionFromSupabaseUser(data.user),
          displayName: displayName.trim() || sessionFromSupabaseUser(data.user).displayName,
        });
        return;
      }

      setLoading(false);
      setMode("signin");
      setPassword("");
      setNotice("Account created. Check your email for a confirmation link, then sign in.");
    } catch (err) {
      fail(formatAuthError(err instanceof Error ? err.message : "Network error"));
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setNotice(null);
    const emailError = validateEmail(email);
    if (emailError) return fail(emailError);

    const supabase = await loadSupabase();
    if (!supabase) {
      return fail(
        "Password reset needs a cloud account. Device-only accounts cannot be recovered. You can create a new one.",
      );
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) return fail(formatAuthError(error.message));
    setNotice("If that email has an account, a reset link is on its way.");
  }

  const onSubmit = mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleForgot;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] p-8 shadow-lg">
        <p className="font-display text-2xl font-bold text-[var(--accent-primary)]">EmoSense</p>

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-3 text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">Just looking around?</p>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            Email: {DEMO_EMAIL}
            <br />
            Password: {DEMO_PASSWORD}
          </p>
          <Button type="button" variant="ghost" className="mt-3 w-full" onClick={enterDemo}>
            Use demo account
          </Button>
        </div>

        {mode !== "forgot" && (
          <div className="mt-6 flex rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-1" role="tablist">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={clsx(
                  "min-h-[44px] flex-1 rounded-md text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-[var(--accent-primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        )}

        <h1 className="mt-6 font-display text-2xl font-bold text-[var(--text-primary)]">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {mode === "signin"
            ? "Sign in with a device account or your cloud account."
            : mode === "signup"
              ? cloudEnabled
                ? "A cloud account keeps your logs safe across devices."
                : "Your account and logs are saved in this browser."
              : "We will email you a link to choose a new password."}
        </p>

        {notice && (
          <p
            className="mt-4 rounded-lg border border-[var(--accent-soft)]/40 bg-[rgba(126,200,164,0.12)] px-3 py-2 text-sm text-[var(--accent-soft)]"
            role="status"
          >
            {notice}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          {mode === "signup" && cloudEnabled && (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={localOnlyAccount}
                onChange={(e) => setLocalOnlyAccount(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-primary)]"
              />
              <span>
                <span className="font-medium text-[var(--text-primary)]">Save on this device only</span>
                <span className="block text-xs text-[var(--text-muted)]">
                  No email needed. Data stays in this browser and cannot be recovered if cleared.
                </span>
              </span>
            </label>
          )}

          {mode === "signup" && (
            <label className="block text-sm text-[var(--text-secondary)]">
              Name (optional)
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
                maxLength={60}
              />
            </label>
          )}

          <label className="block text-sm text-[var(--text-secondary)]">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>

          {mode !== "forgot" && (
            <div className="text-sm text-[var(--text-secondary)]">
              <label htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={clsx(inputClass, "pr-20")}
                  placeholder={
                    mode === "signup"
                      ? `${MIN_PASSWORD_LENGTH}+ characters, a letter and a number`
                      : "Your password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 mt-1 min-h-[36px] -translate-y-1/2 rounded px-2 text-xs font-medium text-neutral-600 hover:text-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {mode !== "forgot" && (
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent-primary)]"
                />
                Keep me signed in
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  className="text-sm text-[var(--accent-primary)] underline-offset-4 hover:underline"
                  onClick={() => switchMode("forgot")}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {inlineError && (
            <p
              className="rounded-lg border border-[#E07B7B]/40 bg-[rgba(224,123,123,0.1)] px-3 py-2 text-sm text-[#E07B7B]"
              role="alert"
            >
              {inlineError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </Button>
        </form>

        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="mt-6 inline-flex min-h-[44px] items-center text-sm text-[var(--text-muted)] underline-offset-4 hover:underline"
          >
            Back to sign in
          </button>
        ) : (
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center text-sm text-[var(--text-muted)] underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
        )}
      </div>
    </main>
  );
}
