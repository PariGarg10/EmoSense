"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import { ensureProfile } from "@/src/lib/authProfile";
import {
  clearBrowserAuth,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  demoUser,
  registerLocalAccount,
  setDemoSession,
  setLocalSession,
  tryDemoLogin,
  verifyLocalLogin,
} from "@/src/lib/sessionAuth";
import { createClient } from "@/src/lib/supabase";
import { useEmoSenseStore } from "@/lib/store";

type AuthMode = "signin" | "signup";

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect. Try again or sign up first.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "This email already has an account. Use Sign in instead.";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return message;
}

const inputClass =
  "mt-2 min-h-[48px] w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-black placeholder:text-neutral-500";

const passwordInputClass =
  "mt-2 min-h-[48px] w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-black placeholder:text-neutral-500";

export default function LoginPage() {
  const router = useRouter();
  const addToast = useEmoSenseStore((s) => s.addToast);
  const setUser = useEmoSenseStore((s) => s.setUser);
  const setUserRole = useEmoSenseStore((s) => s.setUserRole);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localOnlyAccount, setLocalOnlyAccount] = useState(true);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setInlineError(null);
    setSignupDone(false);
    setPassword("");
  }

  function goDashboardAfterBrowserAuth() {
    addToast({ variant: "success", message: "Welcome to EmoSense!" });
    router.replace("/dashboard");
  }

  function enterDemo() {
    setInlineError(null);
    clearBrowserAuth();
    setDemoSession();
    const u = demoUser();
    setUser({ id: u.id, email: u.email, displayName: u.displayName });
    setUserRole("user");
    goDashboardAfterBrowserAuth();
  }

  async function afterSupabaseSession(
    supabase: NonNullable<ReturnType<typeof createClient>>,
    authUser: import("@supabase/supabase-js").User,
    name?: string,
  ) {
    clearBrowserAuth();
    const profile = await ensureProfile(supabase, authUser, name);
    setUser({
      id: authUser.id,
      email: authUser.email,
      displayName: profile.displayName ?? undefined,
    });
    setUserRole(profile.role);
    goDashboardAfterBrowserAuth();
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setInlineError(null);

    if (tryDemoLogin(email, password)) {
      setDemoSession();
      const u = demoUser();
      setUser({ id: u.id, email: u.email, displayName: u.displayName });
      setUserRole("user");
      goDashboardAfterBrowserAuth();
      return;
    }

    const localAcc = verifyLocalLogin(email, password);
    if (localAcc) {
      setLocalSession({
        kind: "local",
        id: localAcc.id,
        email: localAcc.email,
        displayName: localAcc.displayName,
      });
      setUser({
        id: localAcc.id,
        email: localAcc.email,
        displayName: localAcc.displayName,
      });
      setUserRole("user");
      goDashboardAfterBrowserAuth();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setInlineError(
        "Unknown email/password. Use the demo account, create a device-only account on Sign up, or add Supabase keys.",
      );
      addToast({ variant: "error", message: "Sign-in failed." });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      const friendly = formatAuthError(error.message);
      setInlineError(friendly);
      addToast({ variant: "error", message: friendly });
      return;
    }

    if (!data.user) {
      setInlineError("Could not sign in. Please try again.");
      return;
    }

    await afterSupabaseSession(supabase, data.user);
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setInlineError(null);
    setSignupDone(false);

    if (password.length < 6) {
      setInlineError("Password must be at least 6 characters.");
      return;
    }

    if (localOnlyAccount) {
      const result = registerLocalAccount(email, password, displayName);
      if (!result.ok) {
        setInlineError(result.error);
        addToast({ variant: "error", message: result.error });
        return;
      }
      const acc = verifyLocalLogin(email, password);
      if (acc) {
        setLocalSession({
          kind: "local",
          id: acc.id,
          email: acc.email,
          displayName: acc.displayName,
        });
        setUser({
          id: acc.id,
          email: acc.email,
          displayName: acc.displayName,
        });
        setUserRole("user");
        goDashboardAfterBrowserAuth();
      }
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setInlineError("Cloud sign-up needs Supabase keys—or leave “Save on this device only” checked.");
      addToast({ variant: "error", message: "Sign-up is not configured." });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() || undefined },
      },
    });
    setLoading(false);

    if (error) {
      const friendly = formatAuthError(error.message);
      setInlineError(friendly);
      addToast({ variant: "error", message: friendly });
      return;
    }

    if (data.session && data.user) {
      await afterSupabaseSession(supabase, data.user, displayName.trim() || undefined);
      return;
    }

    if (data.user) {
      await ensureProfile(supabase, data.user, displayName);
    }

    setSignupDone(true);
    setMode("signin");
    setPassword("");
    addToast({
      variant: "success",
      message: "Check your email to confirm, or use “Save on this device only” for instant access.",
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] p-8 shadow-lg">
        <p className="font-display text-2xl font-bold text-[var(--accent-primary)]">EmoSense</p>

        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-3 text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">Demo login</p>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            Email: {DEMO_EMAIL}
            <br />
            Password: {DEMO_PASSWORD}
          </p>
          <Button type="button" variant="ghost" className="mt-3 w-full" onClick={enterDemo}>
            Use demo account
          </Button>
        </div>

        <div className="mt-6 flex rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={clsx(
              "min-h-[44px] flex-1 rounded-md text-sm font-medium transition-colors",
              mode === "signin"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={clsx(
              "min-h-[44px] flex-1 rounded-md text-sm font-medium transition-colors",
              mode === "signup"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            Sign up
          </button>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold text-[var(--text-primary)]">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {mode === "signin"
            ? "Sign in with demo, a device-saved account, or Supabase."
            : "Default: account on this device only—no email."}
        </p>

        {signupDone && mode === "signin" && (
          <p
            className="mt-4 rounded-lg border border-[var(--accent-soft)]/40 bg-[rgba(126,200,164,0.12)] px-3 py-2 text-sm text-[var(--accent-soft)]"
            role="status"
          >
            If you used cloud sign-up, confirm your email. Or use “Save on this device only” next time.
          </p>
        )}

        <form
          className="mt-6 space-y-4"
          onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
        >
          {mode === "signup" && (
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
                  No confirmation email. Stays in this browser only.
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

          <label className="block text-sm text-[var(--text-secondary)]">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={passwordInputClass}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            />
          </label>

          {inlineError && (
            <p
              className="rounded-lg border border-[#E07B7B]/40 bg-[rgba(224,123,123,0.1)] px-3 py-2 text-sm text-[#E07B7B]"
              role="alert"
            >
              {inlineError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-flex min-h-[44px] items-center text-sm text-[var(--text-muted)] underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
