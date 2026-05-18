"use client";

import { useMemo, useState } from "react";
import { getTheme } from "@/src/lib/emotionTheme";

type Cell = { day: string; emotion: string; count: number };

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const emotionRows = ["Calm", "Happy", "Anxious", "Angry", "Sad", "Surprise"] as const;

const sample: Cell[] = [
  { day: "Mon", emotion: "Calm", count: 2 },
  { day: "Mon", emotion: "Anxious", count: 1 },
  { day: "Tue", emotion: "Anxious", count: 3 },
  { day: "Tue", emotion: "Happy", count: 1 },
  { day: "Wed", emotion: "Calm", count: 4 },
  { day: "Thu", emotion: "Angry", count: 2 },
  { day: "Thu", emotion: "Sad", count: 1 },
  { day: "Fri", emotion: "Anxious", count: 2 },
  { day: "Sat", emotion: "Happy", count: 3 },
  { day: "Sun", emotion: "Calm", count: 2 },
];

const emotionThemeKey: Record<string, string> = {
  Calm: "neutral",
  Happy: "joy",
  Anxious: "anxiety",
  Angry: "anger",
  Sad: "sadness",
  Surprise: "surprise",
};

export default function WeeklyBehaviourHeatmap() {
  const [tip, setTip] = useState<string | null>(null);

  const lookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of sample) {
      map.set(`${c.day}|${c.emotion}`, c.count);
    }
    return map;
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,#161C26)] p-6 transition-[background-color] duration-[600ms] ease-out">
      <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
        Weekly pattern
      </h2>
      <p className="mt-2 font-body text-sm text-[var(--text-secondary)]">
        Each square uses that emotion&apos;s colour from your theme.
      </p>

      <div className="mt-8 overflow-x-auto">
        <div
          className="min-w-[640px]"
          style={{
            display: "grid",
            gridTemplateColumns: `96px repeat(${days.length}, minmax(0,1fr))`,
          }}
        >
          <div />
          {days.map((d) => (
            <div
              key={d}
              className="px-1 text-center font-mono text-xs text-[var(--text-muted)]"
            >
              {d}
            </div>
          ))}

          {emotionRows.map((emotion) => (
            <div key={emotion} className="contents">
              <div className="flex items-center py-2 pr-2 text-sm font-medium text-[var(--text-secondary)]">
                {emotion}
              </div>
              {days.map((day) => {
                const count = lookup.get(`${day}|${emotion}`) ?? 0;
                const themeKey = emotionThemeKey[emotion] ?? "neutral";
                const accent = getTheme(themeKey).accentColor;
                const fill =
                  count === 0
                    ? "var(--bg-base)"
                    : `color-mix(in srgb, ${accent} ${18 + count * 14}%, var(--bg-base))`;
                const label =
                  count === 0
                    ? `No ${emotion} on ${day}`
                    : `${count}× ${emotion} on ${day}`;
                return (
                  <button
                    key={`${emotion}-${day}`}
                    type="button"
                    className="m-1 h-12 rounded-lg border border-[var(--border)] text-xs font-mono text-[var(--emotion-text,var(--text-primary))] transition-transform duration-300 hover:scale-[1.02]"
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

      <p
        className="mt-4 font-body text-sm text-[var(--text-secondary)]"
        aria-live="polite"
      >
        {tip ?? "Hover or focus a square to read the exact count."}
      </p>
    </div>
  );
}
