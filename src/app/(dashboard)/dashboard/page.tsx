"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Camera,
  ChartLine,
  ChatCircleText,
  ClipboardText,
  Microphone,
  NotePencil,
  Trash,
} from "@phosphor-icons/react";
import Card from "@/src/components/ui/Card";
import Button from "@/src/components/ui/Button";
import EmotionChip from "@/src/components/ui/EmotionChip";
import Modal from "@/src/components/ui/Modal";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import DashboardEmotionWheel from "@/src/components/emotion/DashboardEmotionWheel";
import MoodCard from "@/src/components/emotion/MoodCard";
import { useEmoSenseStore } from "@/lib/store";
import { useUserLogs } from "@/src/hooks/useUserLogs";
import { applyEmotionTheme, getTheme } from "@/src/lib/emotionTheme";
import { formatDistanceToNow } from "@/src/lib/formatDistance";
import {
  addEmotionLog,
  computeStreak,
  dayKey,
  deleteBehaviourLog,
  deleteEmotionLog,
  mergeActivity,
  updateEmotionNote,
  type ActivityEntry,
  type EmotionLogRow,
} from "@/src/lib/logRepository";

const FaceScanner = dynamic(() => import("@/src/components/emotion/FaceScanner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[300px] items-center justify-center text-sm text-[var(--text-secondary)]">
      Setting up face reader…
    </div>
  ),
});

const QUICK_ACTIONS = [
  { href: "/emotion-scan", label: "Read a face", icon: Camera },
  { href: "/voice-tone", label: "Voice tone", icon: Microphone },
  { href: "/behaviour-tracker", label: "Mood tracker", icon: ChartLine },
  { href: "/helpbot", label: "Helpbot", icon: ChatCircleText },
  { href: "/emotion-dictionary", label: "Dictionary", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: ClipboardText },
] as const;

function FlameIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="#F97316" aria-hidden>
      <path d="M12 23c-3.9 0-7-3.1-7-7 0-2.5 1.4-4.6 3.5-5.7C7.5 8.4 8.2 5.5 10 3.5 10.5 5.5 11.5 7 13 7.5 13 4.5 15 2 17.5 2 20 2 22.5 4 23 7c0 3.9-3.1 7-7 7z" />
    </svg>
  );
}

function CameraFabIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const user = useEmoSenseStore((s) => s.user);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const setLastScan = useEmoSenseStore((s) => s.setLastScan);
  const recordDailyEmotion = useEmoSenseStore((s) => s.recordDailyEmotion);
  const reminderOn = useEmoSenseStore((s) => s.dailyReminderEnabled);
  const { emotionLogs, behaviourLogs, loading } = useUserLogs();

  const [selected, setSelected] = useState<string | null>(null);
  const [checkInNote, setCheckInNote] = useState("");
  const [savedEmotion, setSavedEmotion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLog, setScanLog] = useState<EmotionLogRow | null>(null);
  const [editing, setEditing] = useState<{ id: string; note: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const activity = useMemo(
    () => mergeActivity(emotionLogs, behaviourLogs),
    [emotionLogs, behaviourLogs],
  );

  const stats = useMemo(() => {
    const todayKey = dayKey(new Date());
    const today = activity.find((a) => dayKey(new Date(a.logged_at)) === todayKey) ?? null;
    const lastScan = emotionLogs.find((l) => l.source === "scan") ?? null;
    const streak = computeStreak(activity.map((a) => a.logged_at));

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);
    const week = activity.filter((a) => new Date(a.logged_at) >= weekStart);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = dayKey(d);
      const entries = week.filter((a) => dayKey(new Date(a.logged_at)) === key);
      return {
        key,
        label: d.toLocaleDateString([], { weekday: "short" }),
        emotion: mostCommon(entries.map((e) => getTheme(e.emotion).label)),
        count: entries.length,
      };
    });

    return {
      today,
      lastScan,
      streak,
      weekCount: week.length,
      weekTop: mostCommon(week.map((a) => getTheme(a.emotion).label)),
      days,
    };
  }, [activity, emotionLogs]);

  useEffect(() => {
    const latest = activity[0];
    if (latest) applyEmotionTheme(latest.emotion);
  }, [activity]);

  const handleSaveCheckIn = async () => {
    if (!selected || !user?.id) return;
    setSaving(true);
    try {
      await addEmotionLog({
        userId: user.id,
        emotion: selected,
        source: "manual",
        note: checkInNote,
      });
      recordDailyEmotion(selected, "manual");
      applyEmotionTheme(selected);
      setSavedEmotion(selected);
      setCheckInNote("");
      addToast({
        variant: "success",
        message: "Your check-in was saved. Thank you for noticing how you feel.",
      });
    } catch {
      addToast({ variant: "error", message: "Could not save your check-in. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleScanResult = async (emotion: string, confidence: number) => {
    if (!user?.id) return;
    setLastScan({ emotion: getTheme(emotion).label, confidence });
    recordDailyEmotion(emotion, "scan");
    setScannerOpen(false);
    const row = await addEmotionLog({ userId: user.id, emotion, source: "scan", confidence });
    setScanLog(row);
  };

  const handleAddReason = async (reason: string) => {
    if (!user?.id || !scanLog) return;
    const ok = await updateEmotionNote(user.id, scanLog.id, reason);
    addToast(
      ok
        ? { variant: "success", message: "Reason added to your scan." }
        : { variant: "error", message: "Could not save that reason." },
    );
    if (ok) setScanLog(null);
  };

  const handleDelete = async (entry: ActivityEntry) => {
    if (!user?.id) return;
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    const ok =
      entry.kind === "emotion"
        ? await deleteEmotionLog(user.id, entry.id)
        : await deleteBehaviourLog(user.id, entry.id);
    addToast(
      ok
        ? { variant: "info", message: "Entry deleted." }
        : { variant: "error", message: "Could not delete that entry." },
    );
  };

  const handleSaveNote = async () => {
    if (!user?.id || !editing) return;
    const ok = await updateEmotionNote(user.id, editing.id, editing.note);
    setEditing(null);
    if (!ok) addToast({ variant: "error", message: "Could not save that note." });
  };

  const visibleActivity = showAll ? activity.slice(0, 30) : activity.slice(0, 6);
  const name = user?.displayName?.split(" ")[0];

  const rowEnter = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, ease: "easeOut", delay: Math.min(index, 6) * 0.05 },
        };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <p className="font-body text-sm text-[var(--text-secondary)]">
          {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          {greeting()}
          {name ? `, ${name}` : ""}
        </h1>
      </header>

      {reminderOn && !loading && !stats.today && (
        <div
          className="rounded-xl border border-[var(--emotion-accent,#5B8DEF)]/40 bg-[color-mix(in_srgb,var(--emotion-accent,#5B8DEF)_10%,transparent)] px-4 py-3 font-body text-sm"
          role="status"
        >
          You have not checked in today yet. Pick a feeling on the wheel when you are ready.
        </div>
      )}

      <section>
        <Card className="w-full">
          <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            How do you feel right now?
          </h2>

          <div className="mt-8 flex justify-center">
            <DashboardEmotionWheel
              selected={selected}
              onSelect={(key) => {
                setSelected(key);
                setSavedEmotion(null);
              }}
            />
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <label htmlFor="checkin-note" className="font-body text-sm text-[var(--text-secondary)]">
              What happened? (optional)
            </label>
            <input
              id="checkin-note"
              type="text"
              value={checkInNote}
              onChange={(e) => setCheckInNote(e.target.value)}
              maxLength={200}
              placeholder="A short note helps you spot patterns later"
              className="mt-2 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 font-body text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <Button
              disabled={!selected || saving}
              loading={saving}
              onClick={() => void handleSaveCheckIn()}
              className="min-w-[200px]"
            >
              Save check-in
            </Button>

            <div aria-live="polite" className="min-h-[4rem] text-center">
              {savedEmotion ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={reduceMotion ? false : { opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <EmotionFace emotion={savedEmotion} size="md" />
                  <p className="font-body text-base text-[var(--emotion-text,var(--text-secondary))]">
                    You feel {getTheme(savedEmotion).label} right now 💙
                  </p>
                </motion.div>
              ) : (
                <p className="font-body text-sm text-[var(--text-secondary)]">
                  Pick a segment on the wheel, then save your check-in.
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">Today&apos;s mood</p>
          <div className="mt-4 flex items-center gap-4">
            <EmotionFace emotion={stats.today?.emotion ?? "neutral"} size="sm" animated={false} />
            <div>
              <p className="font-display text-lg font-bold">
                {loading ? "…" : stats.today ? getTheme(stats.today.emotion).label : "Not logged yet"}
              </p>
              {stats.today && (
                <p className="font-body text-sm text-[var(--text-secondary)]">
                  logged at {formatLogTime(stats.today.logged_at)}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">Your streak</p>
          <div className="mt-4 flex items-center gap-3">
            <FlameIcon />
            <p className="font-display text-5xl font-bold leading-none">{loading ? "…" : stats.streak}</p>
          </div>
          <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
            {stats.streak === 1 ? "day" : "days"} in a row
          </p>
        </Card>

        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">Last face scan</p>
          <div className="mt-4 flex items-center gap-4">
            <EmotionFace emotion={stats.lastScan?.emotion ?? "neutral"} size="sm" animated={false} />
            <div>
              <p className="font-display text-lg font-bold">
                {stats.lastScan ? getTheme(stats.lastScan.emotion).label : "No scan yet"}
              </p>
              {stats.lastScan && (
                <p className="font-body text-sm text-[var(--text-secondary)]">
                  {formatDistanceToNow(stats.lastScan.logged_at)}
                  {stats.lastScan.confidence != null ? ` · ${Math.round(stats.lastScan.confidence)}%` : ""}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">This week</p>
          <p className="mt-4 font-display text-5xl font-bold leading-none">{loading ? "…" : stats.weekCount}</p>
          <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
            {stats.weekTop ? `entries · mostly ${stats.weekTop}` : "entries logged"}
          </p>
        </Card>
      </section>

      <section aria-labelledby="week-heading">
        <h2 id="week-heading" className="mb-4 font-display text-xl font-bold">
          Last 7 days
        </h2>
        <ol className="grid grid-cols-7 gap-2">
          {stats.days.map((d) => (
            <li
              key={d.key}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] px-1 py-3"
              aria-label={
                d.emotion ? `${d.label}: mostly ${d.emotion}, ${d.count} entries` : `${d.label}: no entries`
              }
            >
              <span className="font-mono text-xs text-[var(--text-muted)]">{d.label}</span>
              {d.emotion ? (
                <span
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: getTheme(d.emotion).faceColor }}
                  title={d.emotion}
                  aria-hidden
                />
              ) : (
                <span className="h-8 w-8 rounded-full border border-dashed border-[var(--border)]" aria-hidden />
              )}
              <span className="hidden max-w-full truncate text-[11px] text-[var(--text-secondary)] sm:block">
                {d.emotion ?? "—"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="mb-4 font-display text-xl font-bold">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-3 text-center font-body text-sm font-medium transition-colors hover:border-[var(--emotion-accent,#5B8DEF)]"
            >
              <Icon size={26} weight="duotone" className="text-[var(--emotion-accent,#5B8DEF)]" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="recent-heading" className="font-display text-xl font-bold">
            Recent log
          </h2>
          {activity.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="min-h-[44px] text-sm text-[var(--emotion-accent,#5B8DEF)] underline-offset-4 hover:underline"
            >
              {showAll ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--emotion-surface,#161C26)]" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-6 text-center font-body text-sm text-[var(--text-secondary)]">
            Nothing logged yet. Save a check-in above or scan a face to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleActivity.map((log, index) => {
              const accent = getTheme(log.emotion).accentColor;
              const isEditing = editing?.id === log.id;
              return (
                <motion.li
                  key={log.id}
                  {...rowEnter(index)}
                  className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3"
                  style={{ backgroundColor: `color-mix(in srgb, ${accent} 6%, transparent)` }}
                >
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {formatDistanceToNow(log.logged_at)}
                  </span>
                  <EmotionChip emotion={log.emotion} size="sm" />
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                    {log.source === "scan" ? "scan" : log.source === "tracker" ? "tracker" : "check-in"}
                  </span>
                  {isEditing ? (
                    <form
                      className="flex w-full gap-2 md:w-auto md:flex-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSaveNote();
                      }}
                    >
                      <input
                        autoFocus
                        value={editing.note}
                        onChange={(e) => setEditing({ id: log.id, note: e.target.value })}
                        maxLength={200}
                        aria-label="Note"
                        className="min-h-[36px] flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-2 text-sm"
                      />
                      <Button type="submit" variant="ghost" className="min-h-[36px]">
                        Save
                      </Button>
                    </form>
                  ) : (
                    (log.note || log.detail) && (
                      <p className="w-full truncate font-body text-sm text-[var(--text-secondary)] md:w-auto md:flex-1">
                        {[log.detail, log.note].filter(Boolean).join(" · ")}
                      </p>
                    )
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    {log.kind === "emotion" && !isEditing && (
                      <button
                        type="button"
                        onClick={() => setEditing({ id: log.id, note: log.note ?? "" })}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        aria-label="Edit note"
                      >
                        <NotePencil size={18} aria-hidden />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(log)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--accent-alert)]"
                      aria-label="Delete entry"
                    >
                      <Trash size={18} aria-hidden />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>

      {scanLog && (
        <div className="mt-6">
          <MoodCard
            variant="inline"
            emotion={scanLog.emotion}
            timestamp={new Date(scanLog.logged_at)}
            onAddReason={(reason) => void handleAddReason(reason)}
            onDismiss={() => setScanLog(null)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="fab-scan fixed bottom-24 right-6 z-30 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[var(--emotion-accent,#5B8DEF)] text-white shadow-lg transition-[background-color] duration-[600ms] ease-out md:bottom-6"
        aria-label="Open face scanner"
      >
        <CameraFabIcon />
      </button>

      <Modal open={scannerOpen} onClose={() => setScannerOpen(false)} titleId="face-scan-title">
        <h2 id="face-scan-title" className="mb-4 font-display text-xl font-bold text-[var(--text-primary)]">
          Read a face
        </h2>
        {scannerOpen && <FaceScanner onResult={(e, c) => void handleScanResult(e, c)} />}
      </Modal>

      <style jsx>{`
        .fab-scan::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: var(--emotion-accent, #5b8def);
          animation: fab-pulse 2s ease-out infinite;
          z-index: -1;
        }
        @keyframes fab-pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
