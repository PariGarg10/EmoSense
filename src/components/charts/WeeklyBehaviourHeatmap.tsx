"use client";

import { useMemo, useState } from "react";
import { getTheme } from "@/src/lib/emotionTheme";
import { dayKey } from "@/src/lib/logRepository";

export type HeatmapEntry = { logged_at: string; emotion: string };

const DEFAULT_ROWS = ["Calm", "Happy", "Anxious", "Angry", "Sad", "Surprised"];

export default function WeeklyBehaviourHeatmap({
  entries,
  loading = false,
}: {
  entries: HeatmapEntry[];
  loading?: boolean;
}) {
  const [tip, setTip] = useState<string | null>(null);

  const { days, rows, lookup, total } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { key: dayKey(d), label: d.toLocaleDateString([], { weekday: "short" }) };
    });

    const lookup = new Map<string, number>();
    const rowCounts = new Map<string, number>();
    let total = 0;
    for (const e of entries) {
      const when = new Date(e.logged_at);
      if (when < start) continue;
      const label = getTheme(e.emotion).label;
      const k = `${dayKey(when)}|${label}`;
      lookup.set(k, (lookup.get(k) ?? 0) + 1);
      rowCounts.set(label, (rowCounts.get(label) ?? 0) + 1);
      total += 1;
    }

    const seen = [...rowCounts.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
    const rows = [...seen, ...DEFAULT_ROWS.filter((r) => !seen.includes(r))].slice(
      0,
      Math.max(6, seen.length),
    );
    return { days, rows, lookup, total };
  }, [entries]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,#161C26)] p-6 transition-[background-color] duration-[600ms] ease-out">
      <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
        Weekly pattern
      </h2>
      <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
        {loading
          ? "Loading your last 7 days…"
          : total === 0
            ? "No entries in the last 7 days yet. Your pattern will appear here as you log."
            : `${total} entries in the last 7 days. Darker squares mean more entries.`}
      </p>

      <div className="mt-8 overflow-x-auto">
        <div
          className="min-w-[640px]"
          style={{
            display: "grid",
            gridTemplateColumns: `110px repeat(${days.length}, minmax(0,1fr))`,
          }}
        >
          <div />
          {days.map((d) => (
            <div key={d.key} className="px-1 text-center font-mono text-xs text-[var(--text-muted)]">
              {d.label}
            </div>
          ))}

          {rows.map((emotion) => (
            <div key={emotion} className="contents">
              <div className="flex items-center py-2 pr-2 text-sm font-medium text-[var(--text-secondary)]">
                {emotion}
              </div>
              {days.map((day) => {
                const count = lookup.get(`${day.key}|${emotion}`) ?? 0;
                const accent = getTheme(emotion).accentColor;
                const fill =
                  count === 0
                    ? "var(--bg-base)"
                    : `color-mix(in srgb, ${accent} ${Math.min(90, 18 + count * 14)}%, var(--bg-base))`;
                const label =
                  count === 0 ? `No ${emotion} on ${day.label}` : `${count}× ${emotion} on ${day.label}`;
                return (
                  <button
                    key={`${emotion}-${day.key}`}
                    type="button"
                    className="m-1 h-12 rounded-lg border border-[var(--border)] font-mono text-xs text-[var(--emotion-text,var(--text-primary))] transition-transform duration-300 hover:scale-[1.02]"
                    style={{ backgroundColor: fill }}
                    aria-label={label}
                    onMouseEnter={() => setTip(label)}
                    onFocus={() => setTip(label)}
                    onMouseLeave={() => setTip(null)}
                    onBlur={() => setTip(null)}
                  >
                    <span aria-hidden className="font-semibold">
                      {count === 0 ? "—" : count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 font-body text-sm text-[var(--text-secondary)]" aria-live="polite">
        {tip ?? "Hover or focus a square to read the exact count."}
      </p>
    </div>
  );
}
