"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import { generateMonthlyReport } from "@/lib/ai";
import type { LogEntry } from "@/lib/types";
import { useEmoSenseStore } from "@/lib/store";
import { useUserLogs } from "@/src/hooks/useUserLogs";
import { getTheme } from "@/src/lib/emotionTheme";
import { dayKey } from "@/src/lib/logRepository";

const chartFallback = () => (
  <div className="h-full w-full animate-pulse rounded-xl bg-[var(--bg-base)]" />
);
const FrequencyChart = dynamic(
  () => import("@/src/components/charts/ReportCharts").then((m) => m.FrequencyChart),
  { ssr: false, loading: chartFallback },
);
const TrendChart = dynamic(
  () => import("@/src/components/charts/ReportCharts").then((m) => m.TrendChart),
  { ssr: false, loading: chartFallback },
);

const POSITIVE = new Set(["Happy", "Calm", "Affectionate", "Trusting", "Accepting"]);
const DIFFICULT = new Set([
  "Sad",
  "Angry",
  "Scared",
  "Anxious",
  "Lonely",
  "Disgusted",
  "Confused",
  "Embarrassed",
  "Envious",
]);

type Row = {
  id: string;
  logged_at: string;
  emotion: string;
  source: string;
  time_of_day?: string;
  activities?: string[];
  energy_level?: number;
  confidence?: number;
  note?: string;
};

type SortKey = "logged_at" | "emotion" | "energy_level" | "source";

const evaluationMetrics = [
  "Scan agreement rate: how often the user or caregiver agrees with the detected emotion.",
  "Confidence calibration: whether high-confidence scans are more often confirmed than low-confidence scans.",
  "Correction rate: how often users change the suggested emotion after a scan.",
  "Data completeness: days with logs, missing notes, and skipped check-ins.",
  "Support impact: whether coping strategies or caregiver follow-ups reduce repeated distress signals.",
];

function toInputDate(d: Date) {
  return dayKey(d);
}

function startOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function endOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}

function csvCell(value: unknown) {
  const s = value == null ? "" : String(value);
  // Neutralise spreadsheet formulas and quote everything.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function ReportsPage() {
  const role = useEmoSenseStore((s) => s.userRole);
  const user = useEmoSenseStore((s) => s.user);
  const { emotionLogs, behaviourLogs, loading } = useUserLogs();

  const [sortKey, setSortKey] = useState<SortKey>("logged_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toInputDate(d);
  });
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));

  const rows = useMemo<Row[]>(() => {
    const from = startOfDay(startDate).toISOString();
    const to = endOfDay(endDate).toISOString();
    const inRange = (iso: string) => iso >= from && iso <= to;
    return [
      ...emotionLogs.filter((l) => inRange(l.logged_at)).map<Row>((l) => ({
        id: l.id,
        logged_at: l.logged_at,
        emotion: getTheme(l.emotion).label,
        source: l.source === "scan" ? "Face scan" : "Check-in",
        confidence: l.confidence ?? undefined,
        note: l.note ?? undefined,
      })),
      ...behaviourLogs.filter((l) => inRange(l.logged_at)).map<Row>((l) => ({
        id: l.id,
        logged_at: l.logged_at,
        emotion: getTheme(l.emotion).label,
        source: "Mood tracker",
        time_of_day: l.time_of_day ?? undefined,
        activities: l.activities ?? [],
        energy_level: l.energy_level ?? undefined,
        note: l.note ?? undefined,
      })),
    ];
  }, [emotionLogs, behaviourLogs, startDate, endDate]);

  const { barData, barEmotions, trendData, summary } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.emotion, (counts.get(r.emotion) ?? 0) + 1);
    const barEmotions = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([e]) => e);

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const spanDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    // Group by day for short ranges, by week for long ones.
    const bucketDays = spanDays > 31 ? 7 : 1;
    const buckets: { key: string; label: string; from: Date; to: Date }[] = [];
    for (let t = new Date(start); t <= end; t.setDate(t.getDate() + bucketDays)) {
      const from = new Date(t);
      const to = new Date(t);
      to.setDate(to.getDate() + bucketDays);
      buckets.push({
        key: dayKey(from),
        label: from.toLocaleDateString([], { month: "short", day: "numeric" }),
        from,
        to,
      });
    }
    const bucketOf = (iso: string) => {
      const when = new Date(iso);
      return buckets.find((b) => when >= b.from && when < b.to);
    };

    const barMap = new Map<string, Record<string, string | number>>();
    const trendMap = new Map<string, { pos: number; diff: number; total: number; conf: number[] }>();
    for (const b of buckets) {
      barMap.set(b.key, Object.fromEntries([["date", b.label], ...barEmotions.map((e) => [e, 0])]));
      trendMap.set(b.key, { pos: 0, diff: 0, total: 0, conf: [] });
    }
    for (const r of rows) {
      const b = bucketOf(r.logged_at);
      if (!b) continue;
      const bar = barMap.get(b.key)!;
      if (barEmotions.includes(r.emotion)) bar[r.emotion] = (bar[r.emotion] as number) + 1;
      const t = trendMap.get(b.key)!;
      t.total += 1;
      if (POSITIVE.has(r.emotion)) t.pos += 1;
      if (DIFFICULT.has(r.emotion)) t.diff += 1;
      if (r.confidence != null) t.conf.push(r.confidence);
    }

    const trendData = buckets.map((b) => {
      const t = trendMap.get(b.key)!;
      return {
        date: b.label,
        positive: t.total ? Math.round((t.pos / t.total) * 100) : null,
        difficult: t.total ? Math.round((t.diff / t.total) * 100) : null,
        scanConfidence: t.conf.length
          ? Math.round(t.conf.reduce((a, c) => a + c, 0) / t.conf.length)
          : null,
      };
    });

    const days = new Set(rows.map((r) => dayKey(new Date(r.logged_at))));
    const energies = rows.map((r) => r.energy_level).filter((v): v is number => v != null);
    return {
      barData: [...barMap.values()],
      barEmotions,
      trendData,
      summary: {
        total: rows.length,
        activeDays: days.size,
        spanDays,
        top: barEmotions[0] ?? null,
        avgEnergy: energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : null,
        scans: rows.filter((r) => r.source === "Face scan").length,
      },
    };
  }, [rows, startDate, endDate]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, sortDir, sortKey]);

  async function writeNarrative() {
    setNarrativeLoading(true);
    try {
      const payload: LogEntry[] = rows.slice(0, 120).map((r) => ({
        logged_at: r.logged_at,
        emotion: r.emotion,
        time_of_day: r.time_of_day,
        activities: r.activities,
        energy_level: r.energy_level,
        note: r.note,
      }));
      setNarrative(await generateMonthlyReport(payload, role));
    } catch {
      setNarrative("The summary could not be written right now. Your charts and table are still accurate.");
    } finally {
      setNarrativeLoading(false);
    }
  }

  // Draft a summary once data is available; later ranges use the button.
  useEffect(() => {
    if (!loading && !narrative && !narrativeLoading) void writeNarrative();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function exportCsv() {
    const header = ["Date", "Time", "Emotion", "Source", "Time of day", "Activities", "Energy", "Confidence", "Note"];
    const lines = sortedRows.map((r) => {
      const d = new Date(r.logged_at);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        r.emotion,
        r.source,
        r.time_of_day,
        r.activities?.join("; "),
        r.energy_level,
        r.confidence != null ? Math.round(r.confidence) : "",
        r.note,
      ]
        .map(csvCell)
        .join(",");
    });
    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emosense-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center gap-1 text-[var(--text-secondary)]"
      onClick={() => toggleSort(key)}
      aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
    >
      {label}
      {sortKey === key ? (
        sortDir === "asc" ? (
          <CaretUp aria-hidden size={16} />
        ) : (
          <CaretDown aria-hidden size={16} />
        )
      ) : null}
    </button>
  );

  const sectionClass =
    "mt-10 rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6 print:break-inside-avoid";

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
            Reports
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            {role === "user"
              ? "Your emotion patterns over time. Share this page with your caregiver or therapist if you like."
              : "Emotion frequency, behaviour patterns, and a narrative summary for the care team."}
            {user?.displayName ? ` Report for ${user.displayName}.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex min-h-[44px] flex-col text-xs text-[var(--text-muted)]">
            From
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => e.target.value && setStartDate(e.target.value)}
              className="mt-1 min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] px-3 text-sm text-[var(--text-primary)]"
            />
          </label>
          <label className="flex min-h-[44px] flex-col text-xs text-[var(--text-muted)]">
            To
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => e.target.value && setEndDate(e.target.value)}
              className="mt-1 min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] px-3 text-sm text-[var(--text-primary)]"
            />
          </label>
          <Button type="button" variant="ghost" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Entries", loading ? "…" : String(summary.total)],
          ["Days logged", loading ? "…" : `${summary.activeDays} / ${summary.spanDays}`],
          ["Most common", summary.top ?? "—"],
          ["Avg energy", summary.avgEnergy != null ? `${summary.avgEnergy.toFixed(1)} / 5` : "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-4"
          >
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      {!loading && rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">
          No entries between these dates. Save check-ins, face scans, or mood entries and they will appear here.
        </p>
      ) : (
        <>
          <section className={sectionClass}>
            <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
              Emotion frequency
            </h2>
            <div className="mt-6 h-72">
              <FrequencyChart data={barData} emotions={barEmotions} />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
              Longitudinal emotion trends
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Share of entries that were positive or difficult in each {summary.spanDays > 31 ? "week" : "day"}.
              Look at patterns over time instead of treating one scan or one log as the whole story.
            </p>
            <div className="mt-6 h-72">
              <TrendChart data={trendData} />
            </div>
          </section>

          <section className={`${sectionClass} overflow-x-auto`}>
            <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
              Log table
            </h2>
            <table className="mt-6 w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-[var(--text-muted)]">
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">
                    {sortButton("logged_at", "Date")}
                  </th>
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">Time</th>
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">
                    {sortButton("emotion", "Emotion")}
                  </th>
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">
                    {sortButton("source", "Source")}
                  </th>
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">Activity</th>
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">
                    {sortButton("energy_level", "Energy")}
                  </th>
                  <th className="border-b border-[var(--border)] p-3 text-xs uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.slice(0, 300).map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--glow)]">
                    <td className="border-b border-[var(--border)] p-3 font-mono text-xs text-[var(--text-secondary)]">
                      {new Date(row.logged_at).toLocaleDateString()}
                    </td>
                    <td className="border-b border-[var(--border)] p-3 font-mono text-xs text-[var(--text-secondary)]">
                      {new Date(row.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="border-b border-[var(--border)] p-3 text-[var(--emotion-text,var(--text-primary))]">
                      {row.emotion}
                      {row.confidence != null && (
                        <span className="ml-1 text-xs text-[var(--text-muted)]">({Math.round(row.confidence)}%)</span>
                      )}
                    </td>
                    <td className="border-b border-[var(--border)] p-3 text-[var(--text-secondary)]">{row.source}</td>
                    <td className="border-b border-[var(--border)] p-3 text-[var(--text-secondary)]">
                      {[row.time_of_day, row.activities?.join(", ")].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="border-b border-[var(--border)] p-3 text-[var(--text-secondary)]">
                      {row.energy_level ?? "—"}
                    </td>
                    <td className="border-b border-[var(--border)] p-3 text-[var(--text-secondary)]">
                      {row.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedRows.length > 300 && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Showing 300 of {sortedRows.length}. Export CSV for the full list.
              </p>
            )}
          </section>
        </>
      )}

      <section className={sectionClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            Narrative summary
          </h2>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void writeNarrative()}
            loading={narrativeLoading}
            className="print:hidden"
          >
            Rewrite for these dates
          </Button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]" aria-live="polite">
          {narrativeLoading || loading ? (
            <p className="emosense-pulse">Drafting overview…</p>
          ) : (
            <p className="whitespace-pre-line">{narrative}</p>
          )}
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          This summary is a support tool, not a diagnosis.
        </p>
      </section>

      <details className={`${sectionClass} mb-10 print:hidden`}>
        <summary className="cursor-pointer font-display text-xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          How we evaluate accuracy
        </summary>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          These are the metrics to collect before claiming clinical-grade performance.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {evaluationMetrics.map((metric) => (
            <div
              key={metric}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {metric}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
