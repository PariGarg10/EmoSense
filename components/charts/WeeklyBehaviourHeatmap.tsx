"use client";

import { useMemo, useState } from "react";

type Cell = {
  day: string;
  emotion: string;
  count: number;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const emotionRows = ["Calm", "Joy", "Anxious", "Anger", "Sadness", "Tired"] as const;

const sample: Cell[] = [
  { day: "Mon", emotion: "Calm", count: 2 },
  { day: "Mon", emotion: "Anxious", count: 1 },
  { day: "Tue", emotion: "Anxious", count: 3 },
  { day: "Tue", emotion: "Joy", count: 1 },
  { day: "Wed", emotion: "Calm", count: 4 },
  { day: "Thu", emotion: "Anger", count: 2 },
  { day: "Thu", emotion: "Sadness", count: 1 },
  { day: "Fri", emotion: "Anxious", count: 2 },
  { day: "Sat", emotion: "Joy", count: 3 },
  { day: "Sun", emotion: "Tired", count: 2 },
];

function intensityClass(count: number) {
  if (count <= 0) return "bg-[var(--bg-base)]";
  if (count === 1) return "bg-[rgba(91,141,239,0.18)]";
  if (count === 2) return "bg-[rgba(91,141,239,0.32)]";
  if (count === 3) return "bg-[rgba(91,141,239,0.46)]";
  return "bg-[rgba(91,141,239,0.62)]";
}

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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Weekly pattern</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
            Darker blue means more logs. Text labels explain each square so color is not the only cue.
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid" style={{ gridTemplateColumns: `96px repeat(${days.length}, minmax(0,1fr))` }}>
            <div />
            {days.map((d) => (
              <div key={d} className="px-1 text-center font-mono-label text-xs text-[var(--text-muted)]">
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
                  const label =
                    count === 0
                      ? `No ${emotion} logs on ${day}`
                      : `${count}× ${emotion} on ${day}`;
                  return (
                    <button
                      key={`${emotion}-${day}`}
                      type="button"
                      className={`m-1 h-12 rounded-lg border border-[var(--border)] text-xs font-mono-label text-[var(--text-primary)] transition-transform duration-[var(--motion-duration)] ease-out hover:scale-[1.02] ${intensityClass(
                        count
                      )}`}
                      aria-label={label}
                      onMouseEnter={() =>
                        setTip(
                          count === 0
                            ? `No ${emotion.toLowerCase()} entries on ${day}.`
                            : `${count}× ${emotion.toLowerCase()} on ${day}.`
                        )
                      }
                      onFocus={() =>
                        setTip(
                          count === 0
                            ? `No ${emotion.toLowerCase()} entries on ${day}.`
                            : `${count}× ${emotion.toLowerCase()} on ${day}.`
                        )
                      }
                      onMouseLeave={() => setTip(null)}
                      onBlur={() => setTip(null)}
                    >
                      <span className="sr-only">{label}</span>
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
      </div>

      <p className="mt-4 text-sm text-[var(--text-secondary)]" aria-live="polite">
        {tip ?? "Hover or focus a square to read the exact count."}
      </p>
    </div>
  );
}
