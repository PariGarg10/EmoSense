"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { useEmoSenseStore } from "@/lib/store";
import type { ContrastPreset, FontSizePreset, MotionPreset, ThemePreset, UserRole } from "@/lib/types";

const crisisLinks = [
  { label: "Vandrevala Foundation Helpline", href: "https://www.vandrevalafoundation.com/" },
  { label: "iCall Psychosocial Helpline (TISS)", href: "https://icallhelpline.org/" },
];

export default function SettingsPage() {
  const sensory = useEmoSenseStore((s) => s.sensory);
  const setSensory = useEmoSenseStore((s) => s.setSensory);
  const userRole = useEmoSenseStore((s) => s.userRole);
  const setUserRole = useEmoSenseStore((s) => s.setUserRole);
  const dailyReminderEnabled = useEmoSenseStore((s) => s.dailyReminderEnabled);
  const setDailyReminderEnabled = useEmoSenseStore((s) => s.setDailyReminderEnabled);
  const dailyReminderTime = useEmoSenseStore((s) => s.dailyReminderTime);
  const setDailyReminderTime = useEmoSenseStore((s) => s.setDailyReminderTime);
  const weeklyReportEmail = useEmoSenseStore((s) => s.weeklyReportEmail);
  const setWeeklyReportEmail = useEmoSenseStore((s) => s.setWeeklyReportEmail);
  const addToast = useEmoSenseStore((s) => s.addToast);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const previewText = useMemo(
    () => "Preview: The quick brown fox jumps over the lazy dog. 0123456789",
    []
  );

  function downloadData() {
    const blob = new Blob([JSON.stringify(localStorage.getItem("emosense-store"), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emosense-export.json";
    a.click();
    URL.revokeObjectURL(url);
    addToast({ variant: "success", message: "Download started for your local EmoSense data." });
  }

  function deleteAll() {
    localStorage.removeItem("emosense-store");
    addToast({ variant: "info", message: "Local data cleared. The page will reload." });
    window.setTimeout(() => window.location.reload(), 600);
  }

  return (
    <AppShell>
      <header>
        <h1 className="font-display text-4xl font-bold text-[var(--text-primary)] md:text-5xl">Settings</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          Tune sensory defaults for this device. Changes apply right away without reloading the page.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Sensory preferences</h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Font size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["sm", "md", "lg", "xl"] as FontSizePreset[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSensory({ fontSize: size })}
                  className={[
                    "min-h-[44px] rounded-full border px-4 text-sm font-medium capitalize",
                    sensory.fontSize === size
                      ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
                  ].join(" ")}
                >
                  {size === "sm" ? "Small" : size === "md" ? "Medium" : size === "lg" ? "Large" : "Extra large"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-[var(--text-primary)]">Contrast mode</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["standard", "high", "low"] as ContrastPreset[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSensory({ contrast: mode })}
                  className={[
                    "min-h-[44px] rounded-full border px-4 text-sm font-medium capitalize",
                    sensory.contrast === mode
                      ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-[var(--text-primary)]">Motion</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["full", "reduced", "none"] as MotionPreset[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSensory({ motion: mode })}
                  className={[
                    "min-h-[44px] rounded-full border px-4 text-sm font-medium capitalize",
                    sensory.motion === mode
                      ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-[var(--text-primary)]">Color theme</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["dark", "Default (dark)"],
                  ["light", "Light"],
                  ["light-hc", "High contrast light"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSensory({ theme: value as ThemePreset })}
                  className={[
                    "min-h-[44px] rounded-full border px-4 text-sm font-medium",
                    sensory.theme === value
                      ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4 text-sm text-[var(--text-secondary)]">
          {previewText}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Demo role (for Reports)</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Supabase roles will replace this switch once auth is wired. For now it only unlocks the Reports layout.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["user", "caregiver", "therapist"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setUserRole(r)}
              className={[
                "min-h-[44px] rounded-full border px-4 text-sm font-medium capitalize",
                userRole === r
                  ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                  : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Notifications</h2>
        <div className="mt-6 space-y-4">
          <label className="flex min-h-[44px] items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
            <span className="text-sm text-[var(--text-primary)]">Daily check-in reminder</span>
            <input
              type="checkbox"
              checked={dailyReminderEnabled}
              onChange={(e) => setDailyReminderEnabled(e.target.checked)}
              className="h-6 w-6 accent-[var(--accent-primary)]"
            />
          </label>
          <label className="flex min-h-[44px] flex-col gap-2 text-sm text-[var(--text-secondary)]">
            Reminder time
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => setDailyReminderTime(e.target.value)}
              className="min-h-[44px] max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)]"
            />
          </label>
          <label className="flex min-h-[44px] items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3">
            <span className="text-sm text-[var(--text-primary)]">Weekly report email</span>
            <input
              type="checkbox"
              checked={weeklyReportEmail}
              onChange={(e) => setWeeklyReportEmail(e.target.checked)}
              className="h-6 w-6 accent-[var(--accent-primary)]"
            />
          </label>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Privacy &amp; data</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={downloadData}>
            Download my data
          </Button>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete all data
          </Button>
        </div>
        {deleteOpen && (
          <div className="mt-4 rounded-xl border border-[var(--accent-alert)]/40 bg-[rgba(224,123,123,0.08)] p-4 text-sm text-[var(--text-secondary)]">
            <p>This removes locally stored EmoSense preferences and activity on this browser.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="button" variant="danger" onClick={deleteAll}>
                Confirm delete
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10 mb-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">About &amp; support</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
          <li>
            <a className="text-[var(--accent-primary)] underline-offset-4 hover:underline" href="https://www.autism.org.uk/">
              Autism-friendly help overview (external)
            </a>
          </li>
          {crisisLinks.map((l) => (
            <li key={l.href}>
              <a className="text-[var(--accent-primary)] underline-offset-4 hover:underline" href={l.href}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
