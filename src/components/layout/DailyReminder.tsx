"use client";

import { useEffect } from "react";
import { useEmoSenseStore } from "@/lib/store";
import { dayKey, listBehaviourLogs, listEmotionLogs } from "@/src/lib/logRepository";

const SHOWN_KEY = "emosense-reminder-shown";

function msUntil(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const target = new Date();
  target.setHours(h || 0, m || 0, 0, 0);
  return target.getTime() - Date.now();
}

/** Shows a browser notification at the chosen time if nothing was logged today. */
export default function DailyReminder() {
  const enabled = useEmoSenseStore((s) => s.dailyReminderEnabled);
  const time = useEmoSenseStore((s) => s.dailyReminderTime);
  const userId = useEmoSenseStore((s) => s.user?.id);

  useEffect(() => {
    if (!enabled || !userId || !("Notification" in window)) return;

    async function fire() {
      const today = dayKey(new Date());
      try {
        if (localStorage.getItem(SHOWN_KEY) === today) return;
      } catch {
        /* ignore */
      }
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const [e, b] = await Promise.all([
        listEmotionLogs(userId!, { from, limit: 1 }),
        listBehaviourLogs(userId!, { from, limit: 1 }),
      ]);
      if (e.length || b.length || Notification.permission !== "granted") return;
      new Notification("EmoSense check-in", {
        body: "How are you feeling today? A quick check-in takes a few seconds.",
        tag: "emosense-daily",
      });
      try {
        localStorage.setItem(SHOWN_KEY, today);
      } catch {
        /* ignore */
      }
    }

    const wait = msUntil(time);
    // Already past today's time: remind once now (if still not logged).
    const timer = window.setTimeout(() => void fire(), Math.max(wait, 5_000));
    return () => window.clearTimeout(timer);
  }, [enabled, time, userId]);

  return null;
}
