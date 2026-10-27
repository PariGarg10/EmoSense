"use client";

import { FormEvent, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useEmoSenseStore } from "@/lib/store";
import type {
  ContrastPreset,
  FontSizePreset,
  MotionPreset,
  ThemePreset,
  UserRole,
} from "@/lib/types";
import { signOut } from "@/src/lib/authGate";
import { deleteAllLogs, exportLogs } from "@/src/lib/logRepository";
import {
  changeLocalPassword,
  deleteLocalAccount,
  getSession,
  updateLocalDisplayName,
  updateSession,
  validatePassword,
  type AuthKind,
} from "@/src/lib/sessionAuth";
import { loadSupabase } from "@/src/lib/supabaseEnv";

const cardClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface)] p-6 md:p-8";

const inputClass =
  "mt-2 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)]";

const crisisLinks = [
  { label: "Tele-MANAS (India, 24/7)", href: "tel:14416", detail: "14416" },
  { label: "Vandrevala Foundation", href: "https://www.vandrevalafoundation.com/" },
  { label: "iCall", href: "https://icallhelpline.org/" },
  { label: "NIMHANS", href: "tel:08046110007", detail: "080-46110007" },
  { label: "Find a helpline in another country", href: "https://findahelpline.com/" },
];

const ROLE_OPTIONS: { value: UserRole; label: string; detail: string }[] = [
  { value: "user", label: "Me", detail: "I am tracking my own feelings." },
  { value: "caregiver", label: "Caregiver", detail: "I support someone and log with them." },
  { value: "therapist", label: "Therapist", detail: "Reports use clinical-style language." },
];

export default function SettingsPage() {
  const user = useEmoSenseStore((s) => s.user);
  const setUser = useEmoSenseStore((s) => s.setUser);
  const role = useEmoSenseStore((s) => s.userRole);
  const setUserRole = useEmoSenseStore((s) => s.setUserRole);
  const sensory = useEmoSenseStore((s) => s.sensory);
  const setSensory = useEmoSenseStore((s) => s.setSensory);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const reminderEnabled = useEmoSenseStore((s) => s.dailyReminderEnabled);
  const setReminderEnabled = useEmoSenseStore((s) => s.setDailyReminderEnabled);
  const reminderTime = useEmoSenseStore((s) => s.dailyReminderTime);
  const setReminderTime = useEmoSenseStore((s) => s.setDailyReminderTime);

  const [authKind, setAuthKind] = useState<AuthKind | null>(null);
  const [name, setName] = useState(user?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setAuthKind(getSession()?.kind ?? null);
  }, []);

  useEffect(() => {
    setName(user?.displayName ?? "");
  }, [user?.displayName]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const displayName = name.trim().slice(0, 60);
    try {
      if (authKind === "supabase") {
        const supabase = await loadSupabase();
        if (supabase) {
          const { error } = await supabase
            .from("profiles")
            .update({ display_name: displayName || null, role })
            .eq("id", user.id);
          if (error) throw error;
          await supabase.auth.updateUser({ data: { display_name: displayName } });
        }
      } else if (authKind === "local") {
        updateLocalDisplayName(user.id, displayName);
      }
      updateSession({ displayName: displayName || undefined });
      setUser({ ...user, displayName: displayName || undefined });
      addToast({ variant: "success", message: "Profile saved." });
    } catch {
      addToast({ variant: "error", message: "Could not save your profile. Try again." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPwError(null);
    setPwBusy(true);
    try {
      if (authKind === "local") {
        const problem = await changeLocalPassword(user.id, pwCurrent, pwNext);
        if (problem) return setPwError(problem);
      } else if (authKind === "supabase") {
        const problem = validatePassword(pwNext);
        if (problem) return setPwError(problem);
        const { error } = (await (await loadSupabase())?.auth.updateUser({ password: pwNext })) ?? {};
        if (error) return setPwError(error.message);
      }
      setPwCurrent("");
      setPwNext("");
      addToast({ variant: "success", message: "Password updated." });
    } finally {
      setPwBusy(false);
    }
  }

  async function downloadData() {
    if (!user) return;
    const logs = await exportLogs(user.id);
    let preferences: unknown = {};
    try {
      preferences = JSON.parse(localStorage.getItem("emosense-store") ?? "{}");
    } catch {
      /* ignore */
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, displayName: user.displayName, role, type: authKind },
      ...logs,
      preferences,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emosense-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ variant: "success", message: "Your data download has started." });
  }

  async function deleteAll() {
    if (!user || deleteConfirm.trim().toLowerCase() !== "delete") return;
    setDeleting(true);
    const ok = await deleteAllLogs(user.id);
    useEmoSenseStore.getState().resetUserData();
    if (authKind === "local") {
      deleteLocalAccount(user.id);
      addToast({ variant: "info", message: "Account and data deleted." });
      await signOut();
      return;
    }
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteConfirm("");
    addToast(
      ok
        ? { variant: "info", message: "All your logs were deleted." }
        : { variant: "error", message: "Some cloud data could not be deleted. Try again." },
    );
  }

  async function toggleReminder(next: boolean) {
    if (next && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setReminderEnabled(next);
    if (next && "Notification" in window && Notification.permission === "denied") {
      addToast({
        variant: "info",
        message: "Notifications are blocked, so you will see a reminder on the Home page instead.",
      });
    }
  }

  const accountLabel =
    authKind === "supabase"
      ? "Cloud account (synced)"
      : authKind === "local"
        ? "Device-only account"
        : authKind === "demo"
          ? "Demo account (this browser only)"
          : "—";

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
          Settings
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Your profile, how EmoSense looks and feels, and your data.
        </p>
      </header>

      <section className={`mt-10 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">Profile</h2>
        <form className="mt-6 space-y-6" onSubmit={saveProfile}>
          <label className="block text-sm text-[var(--text-secondary)]">
            Display name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className={inputClass}
              disabled={authKind === "demo"}
            />
          </label>
          <fieldset>
            <legend className="text-sm text-[var(--text-secondary)]">I am using EmoSense as</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    "flex cursor-pointer flex-col rounded-xl border p-3 text-sm",
                    role === opt.value
                      ? "border-[var(--emotion-accent,var(--accent-primary))] bg-[var(--glow)]"
                      : "border-[var(--border)]",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={role === opt.value}
                      onChange={() => setUserRole(opt.value)}
                      className="accent-[var(--accent-primary)]"
                    />
                    {opt.label}
                  </span>
                  <span className="mt-1 text-xs text-[var(--text-muted)]">{opt.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" loading={savingProfile}>
            Save profile
          </Button>
        </form>
      </section>

      <section className={`mt-8 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">Account</h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-[var(--text-muted)]">Email</dt>
          <dd className="text-[var(--text-primary)]">{user?.email ?? "—"}</dd>
          <dt className="text-[var(--text-muted)]">Type</dt>
          <dd className="text-[var(--text-primary)]">{accountLabel}</dd>
        </dl>

        {(authKind === "local" || authKind === "supabase") && (
          <form className="mt-6 space-y-4" onSubmit={changePassword}>
            <h3 className="font-medium text-[var(--text-primary)]">Change password</h3>
            {authKind === "local" && (
              <label className="block text-sm text-[var(--text-secondary)]">
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className={inputClass}
                />
              </label>
            )}
            <label className="block text-sm text-[var(--text-secondary)]">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={pwNext}
                onChange={(e) => setPwNext(e.target.value)}
                className={inputClass}
              />
            </label>
            {pwError && (
              <p className="text-sm text-[var(--accent-alert)]" role="alert">
                {pwError}
              </p>
            )}
            <Button type="submit" variant="ghost" loading={pwBusy} disabled={!pwNext}>
              Update password
            </Button>
          </form>
        )}

        <div className="mt-6">
          <Button type="button" variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </section>

      <section className={`mt-8 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">Sensory</h2>
        <div className="mt-6 space-y-8">
          <ToggleRow
            label="Theme"
            options={[
              ["dark", "Dark"],
              ["light", "Light"],
              ["light-hc", "Light, high contrast"],
            ]}
            value={sensory.theme}
            onChange={(v) => setSensory({ theme: v as ThemePreset })}
          />
          <ToggleRow
            label="Font size"
            options={[
              ["sm", "Small"],
              ["md", "Medium"],
              ["lg", "Large"],
              ["xl", "Extra large"],
            ]}
            value={sensory.fontSize}
            onChange={(v) => setSensory({ fontSize: v as FontSizePreset })}
          />
          <ToggleRow
            label="Contrast"
            options={[
              ["standard", "Standard"],
              ["high", "High"],
              ["low", "Soft"],
            ]}
            value={sensory.contrast}
            onChange={(v) => setSensory({ contrast: v as ContrastPreset })}
          />
          <ToggleRow
            label="Motion"
            options={[
              ["full", "Full"],
              ["reduced", "Reduced"],
              ["none", "None"],
            ]}
            value={sensory.motion}
            onChange={(v) => setSensory({ motion: v as MotionPreset })}
          />
        </div>
      </section>

      <section className={`mt-8 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Daily reminder
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          A gentle nudge to check in if you have not logged anything that day. Notifications appear while EmoSense is
          open in a tab.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => void toggleReminder(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent-primary)]"
            />
            Remind me every day
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            At
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => e.target.value && setReminderTime(e.target.value)}
              disabled={!reminderEnabled}
              className="ml-2 min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)] disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className={`mt-8 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">Privacy</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Download a copy of all your logs and settings, or delete your logs.
          {authKind === "local" && " Deleting also removes your device account."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={() => void downloadData()}>
            Download my data (JSON)
          </Button>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            {authKind === "local" ? "Delete account and data" : "Delete all my logs"}
          </Button>
        </div>
        {deleteOpen && (
          <div className="mt-4 rounded-xl border border-[var(--accent-alert)]/40 bg-[rgba(224,123,123,0.08)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Type <strong className="text-[var(--text-primary)]">delete</strong> to confirm. This cannot be undone.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type delete"
              className="mt-3 min-h-[44px] w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)]"
              autoComplete="off"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="danger"
                loading={deleting}
                disabled={deleteConfirm.trim().toLowerCase() !== "delete"}
                onClick={() => void deleteAll()}
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirm("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className={`mt-8 mb-10 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">Support</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          If you or someone else might be in danger, contact local emergency services now.
        </p>
        <ul className="mt-4 space-y-3">
          {crisisLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="inline-flex min-h-[44px] items-center text-[var(--emotion-accent,var(--accent-primary))] underline-offset-4 hover:underline"
                {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {link.label}
                {link.detail ? ` → ${link.detail}` : ""}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="font-medium text-[var(--emotion-text,var(--text-primary))]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={[
              "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--motion-duration,300ms)]",
              value === key
                ? "border-[var(--emotion-accent,var(--accent-primary))] bg-[var(--glow)] text-[var(--emotion-text,var(--text-primary))]"
                : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
