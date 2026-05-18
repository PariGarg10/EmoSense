"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Card from "@/src/components/ui/Card";
import Button from "@/src/components/ui/Button";
import EmotionChip from "@/src/components/ui/EmotionChip";
import Modal from "@/src/components/ui/Modal";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import DashboardEmotionWheel from "@/src/components/emotion/DashboardEmotionWheel";
import MoodCard from "@/src/components/emotion/MoodCard";
import { useEmoSenseStore } from "@/lib/store";
import { applyEmotionTheme, getTheme } from "@/src/lib/emotionTheme";
import { formatDistanceToNow } from "@/src/lib/formatDistance";
import {
  fetchLastEmotionLog,
  fetchLastScanLog,
  fetchRecentEmotionLogs,
  fetchStreakLogs,
  fetchTodayMoodLog,
  insertEmotionLog,
  type EmotionLogRow,
} from "@/src/lib/emotionLogs";

const FaceScanner = dynamic(
  () => import("@/src/components/emotion/FaceScanner"),
  { ssr: false },
);

function FlameIcon() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 24 24"
      fill="#F97316"
      aria-hidden
    >
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
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const user = useEmoSenseStore((s) => s.user);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const behaviourStreak = useEmoSenseStore((s) => s.behaviourStreak);
  const setLastScan = useEmoSenseStore((s) => s.setLastScan);
  const recentActivity = useEmoSenseStore((s) => s.recentActivity);

  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [todayLog, setTodayLog] = useState<EmotionLogRow | null>(null);
  const [lastScanLog, setLastScanLog] = useState<EmotionLogRow | null>(null);
  const [recentLogs, setRecentLogs] = useState<EmotionLogRow[]>([]);
  const [streak, setStreak] = useState(behaviourStreak);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMood, setScanMood] = useState<{
    emotion: string;
    timestamp: Date;
  } | null>(null);

  const refreshStats = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;

    const [today, scan, recent, streakCount] = await Promise.all([
      fetchTodayMoodLog(uid),
      fetchLastScanLog(uid),
      fetchRecentEmotionLogs(uid, 5),
      fetchStreakLogs(uid),
    ]);

    setTodayLog(today);
    setLastScanLog(scan);
    setRecentLogs(recent.length ? recent : []);
    if (streakCount > 0) setStreak(streakCount);
  }, [user?.id]);

  useEffect(() => {
    async function loadLastTheme() {
      const uid = user?.id;
      if (!uid) return;
      const last = await fetchLastEmotionLog(uid);
      if (last?.emotion) {
        applyEmotionTheme(last.emotion);
      }
    }
    void loadLastTheme();
    void refreshStats();
  }, [user?.id, refreshStats]);

  const handleSaveCheckIn = async () => {
    if (!selected) return;
    setSaving(true);

    if (user?.id) {
      const row = await insertEmotionLog({
        userId: user.id,
        emotion: selected,
        source: "manual",
      });
      if (row) {
        setTodayLog(row);
        void refreshStats();
      }
    }

    addToast({
      variant: "success",
      message: "Your check-in was saved. Thank you for noticing how you feel.",
    });
    setSaved(true);
    setSaving(false);
    applyEmotionTheme(selected);
  };

  const handleScanResult = async (emotion: string, confidence: number) => {
    const label = getTheme(emotion).label;
    setLastScan({ emotion: label, confidence });
    setScannerOpen(false);
    setScanMood({ emotion: label, timestamp: new Date() });
    if (user?.id) {
      await insertEmotionLog({
        userId: user.id,
        emotion,
        source: "scan",
        confidence,
      });
    }
    void refreshStats();
  };

  const displayLogs: EmotionLogRow[] =
    recentLogs.length > 0
      ? recentLogs
      : recentActivity.slice(0, 5).map((a) => ({
          id: a.id,
          user_id: user?.id ?? "",
          logged_at: a.timestamp,
          emotion: a.emotion,
          confidence: null,
          source: "manual" as const,
          note: a.note ?? null,
        }));

  const rowEnter = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, ease: "easeOut", delay: index * 0.08 },
        };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
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
                setSaved(false);
              }}
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Button
              disabled={!selected || saving}
              loading={saving}
              onClick={() => void handleSaveCheckIn()}
              className="min-w-[200px]"
            >
              Save check-in
            </Button>

            <div aria-live="polite" className="min-h-[4rem] text-center">
              {saved && selected ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={reduceMotion ? false : { opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <EmotionFace emotion={selected} size="md" />
                  <p className="font-body text-base text-[var(--emotion-text,var(--text-secondary))]">
                    You feel {getTheme(selected).label} right now 💙
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Today&apos;s mood
          </p>
          <div className="mt-4 flex items-center gap-4">
            <EmotionFace
              emotion={todayLog?.emotion ?? selected ?? "neutral"}
              size="sm"
              animated={false}
            />
            <div>
              <p className="font-display text-lg font-bold">
                {todayLog
                  ? getTheme(todayLog.emotion).label
                  : selected
                    ? getTheme(selected).label
                    : "Not logged yet"}
              </p>
              {todayLog && (
                <p className="font-body text-sm text-[var(--text-secondary)]">
                  logged at {formatLogTime(todayLog.logged_at)}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Your streak
          </p>
          <div className="mt-4 flex items-center gap-3">
            <FlameIcon />
            <p className="font-display text-5xl font-bold leading-none">
              {streak}
            </p>
          </div>
          <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
            days in a row
          </p>
        </Card>

        <Card>
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Last face scan
          </p>
          <div className="mt-4 flex items-center gap-4">
            <EmotionFace
              emotion={lastScanLog?.emotion ?? "neutral"}
              size="sm"
              animated={false}
            />
            <div>
              <p className="font-display text-lg font-bold">
                {lastScanLog
                  ? getTheme(lastScanLog.emotion).label
                  : "No scan yet"}
              </p>
              {lastScanLog && (
                <p className="font-body text-sm text-[var(--text-secondary)]">
                  {formatDistanceToNow(lastScanLog.logged_at)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">Recent log</h2>
        <ul className="space-y-3">
          {displayLogs.map((log, index) => {
            const accent = getTheme(log.emotion).accentColor;
            return (
              <motion.li
                key={log.id}
                {...rowEnter(index)}
                className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accent} 5%, transparent)`,
                }}
              >
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {formatDistanceToNow(log.logged_at)}
                </span>
                <EmotionChip emotion={log.emotion} size="sm" />
                {log.note && (
                  <p className="w-full truncate font-body text-sm text-[var(--text-secondary)] md:w-auto md:flex-1">
                    {log.note}
                  </p>
                )}
              </motion.li>
            );
          })}
        </ul>
      </section>

      {scanMood && (
        <div className="mt-6">
          <MoodCard
            variant="inline"
            emotion={scanMood.emotion}
            timestamp={scanMood.timestamp}
            onAddReason={() => {}}
            onDismiss={() => setScanMood(null)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setScannerOpen(true)}
        className="fab-scan relative fixed bottom-24 right-6 z-30 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[var(--emotion-accent,#5B8DEF)] text-white shadow-lg transition-[background-color] duration-[600ms] ease-out md:bottom-6"
        aria-label="Open face scanner"
      >
        <CameraFabIcon />
      </button>

      <Modal open={scannerOpen} onClose={() => setScannerOpen(false)}>
        <h2
          id="face-scan-title"
          className="mb-4 font-display text-xl font-bold text-[var(--text-primary)]"
        >
          Read a face
        </h2>
        <FaceScanner onResult={handleScanResult} />
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
