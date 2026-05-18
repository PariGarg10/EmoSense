"use client";

import { useEffect, useState } from "react";
import { generateWeeklyInsights } from "@/lib/ai";
import type { LogEntry } from "@/lib/types";
import { Sparkle } from "@phosphor-icons/react";

const sampleLogs: LogEntry[] = [
  {
    logged_at: new Date().toISOString(),
    emotion: "Calm",
    time_of_day: "Morning",
    activities: ["Home"],
    energy_level: 3,
    note: "Quiet breakfast",
  },
  {
    logged_at: new Date(Date.now() - 86400000).toISOString(),
    emotion: "Anxious",
    time_of_day: "Afternoon",
    activities: ["School"],
    energy_level: 2,
    note: "Fire drill",
  },
  {
    logged_at: new Date(Date.now() - 172800000).toISOString(),
    emotion: "Joy",
    time_of_day: "Evening",
    activities: ["Outdoors"],
    energy_level: 4,
    note: "Walk with dog",
  },
];

export default function AIInsightsCard() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await generateWeeklyInsights(sampleLogs);
        if (!cancelled) setText(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const bullets = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Sparkle className="text-[var(--accent-warm)]" size={28} weight="duotone" aria-hidden />
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Weekly insights</h2>
          <p className="text-sm text-[var(--text-secondary)]">Plain-language ideas based on sample logs.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        {loading ? (
          <p className="emosense-pulse text-sm text-[var(--text-secondary)]">Generating gentle notes…</p>
        ) : (
          bullets.map((line) => (
            <div
              key={line}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {line}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
