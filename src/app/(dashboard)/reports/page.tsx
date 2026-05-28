"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import { generateMonthlyReport } from "@/lib/ai";
import type { LogEntry, UserRole } from "@/lib/types";
import { useEmoSenseStore } from "@/lib/store";
import { EMOTION_THEMES } from "@/src/lib/emotionTheme";
import { createClient } from "@/src/lib/supabase";

const chartEmotions = ["Joy", "Calm", "Sadness", "Anger", "Fear", "Surprise"] as const;

const sampleBars = [
  { date: "May 1", Joy: 2, Calm: 3, Sadness: 0, Anger: 0, Fear: 1, Surprise: 0 },
  { date: "May 2", Joy: 1, Calm: 2, Sadness: 1, Anger: 0, Fear: 0, Surprise: 1 },
  { date: "May 3", Joy: 0, Calm: 1, Sadness: 2, Anger: 1, Fear: 0, Surprise: 0 },
  { date: "May 4", Joy: 3, Calm: 2, Sadness: 0, Anger: 0, Fear: 1, Surprise: 1 },
  { date: "May 5", Joy: 1, Calm: 4, Sadness: 1, Anger: 0, Fear: 0, Surprise: 0 },
];

const sampleTrend = [
  { date: "Week 1", positive: 62, difficult: 24, scanConfidence: 71 },
  { date: "Week 2", positive: 58, difficult: 31, scanConfidence: 68 },
  { date: "Week 3", positive: 66, difficult: 20, scanConfidence: 74 },
  { date: "Week 4", positive: 72, difficult: 18, scanConfidence: 77 },
];

const sampleRows: LogEntry[] = [
  {
    logged_at: "2026-05-12T08:10:00.000Z",
    emotion: "Calm",
    time_of_day: "Morning",
    activities: ["Home"],
    energy_level: 3,
    note: "Slow start, music helped",
  },
  {
    logged_at: "2026-05-12T15:40:00.000Z",
    emotion: "Joy",
    time_of_day: "Afternoon",
    activities: ["School"],
    energy_level: 4,
    note: "Finished art project",
  },
  {
    logged_at: "2026-05-11T19:05:00.000Z",
    emotion: "Sadness",
    time_of_day: "Evening",
    activities: ["Screen time"],
    energy_level: 2,
    note: "Missed friend call",
  },
];

type SortKey = "logged_at" | "emotion" | "energy_level";

const evaluationMetrics = [
  "Scan agreement rate: how often the user or caregiver agrees with the detected emotion.",
  "Confidence calibration: whether high-confidence scans are more often confirmed than low-confidence scans.",
  "Correction rate: how often users change the suggested emotion after a scan.",
  "Data completeness: days with logs, missing notes, and skipped check-ins.",
  "Support impact: whether coping strategies or caregiver follow-ups reduce repeated distress signals.",
];

const futureUpgradeRoadmap = [
  {
    title: "Multimodal emotion analysis",
    detail:
      "Combine facial emotion, optional voice tone, and text sentiment into one explainable result. This needs consent flows, signal weighting, and careful testing.",
  },
  {
    title: "Therapist portal",
    detail:
      "Add therapist workspaces, assigned clients, session notes, shared reports, and role-specific permissions.",
  },
  {
    title: "HIPAA-style data handling",
    detail:
      "Define encryption, audit logs, retention rules, consent, access reviews, incident response, and deployment controls before storing clinical data.",
  },
  {
    title: "Deployment architecture",
    detail:
      "Document production hosting, Supabase RLS, secret management, observability, backups, and model/API boundaries.",
  },
];

function emotionBarColor(label: string): string {
  const key = label.toLowerCase();
  const theme =
    EMOTION_THEMES[key] ??
    EMOTION_THEMES[key.replace(/ness$/, "")] ??
    EMOTION_THEMES["neutral"];
  return theme?.accentColor ?? "#5B8DEF";
}

const palette = Object.fromEntries(
  chartEmotions.map((e) => [e, emotionBarColor(e)]),
) as Record<(typeof chartEmotions)[number], string>;

export default function ReportsPage() {
  const storeRole = useEmoSenseStore((s) => s.userRole);
  const [profileRole, setProfileRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("logged_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-31");

  const role = profileRole ?? storeRole;
  const allowed = role === "caregiver" || role === "therapist";

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setRoleLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setRoleLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.role === "user" || data?.role === "caregiver" || data?.role === "therapist") {
        setProfileRole(data.role);
      }
      setRoleLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const text = await generateMonthlyReport(
          sampleRows,
          role === "therapist" ? "therapist" : "caregiver",
        );
        if (!cancelled) setNarrative(text);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [allowed, role]);

  const sortedRows = useMemo(() => {
    const rows = [...sampleRows];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null || bv == null) return 0;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [sortDir, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (roleLoading) {
    return (
      <div className="text-[var(--text-secondary)]">
        <p>Loading reports…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Reports
        </h1>
        <p className="mt-4 max-w-xl text-[var(--text-secondary)]">
          Ask your caregiver for access
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
            Reports
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            Emotion frequency, behaviour patterns, and a monthly narrative for your care team.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-h-[44px] flex-col text-xs text-[var(--text-muted)]">
            From
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] px-3 text-sm text-[var(--text-primary)]"
            />
          </label>
          <label className="flex min-h-[44px] flex-col text-xs text-[var(--text-muted)]">
            To
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] px-3 text-sm text-[var(--text-primary)]"
            />
          </label>
          <Button type="button" variant="ghost" onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </header>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6">
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Emotion frequency
        </h2>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleBars}>
              <CartesianGrid stroke="rgba(237,242,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--emotion-surface, var(--bg-elevated))",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--emotion-text, var(--text-primary))",
                }}
              />
              <Legend />
              {chartEmotions.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="emo"
                  fill={palette[key]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
              Longitudinal emotion trends
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Track patterns over time instead of treating one scan or one mood log as the whole story.
            </p>
          </div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--text-muted)]">
            Sample trend view
          </span>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleTrend}>
              <CartesianGrid stroke="rgba(237,242,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--emotion-surface, var(--bg-elevated))",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--emotion-text, var(--text-primary))",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="positive"
                name="Positive / regulated mood"
                stroke="var(--accent-soft)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="difficult"
                name="Difficult mood signals"
                stroke="var(--accent-alert)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="scanConfidence"
                name="Average scan confidence"
                stroke="var(--emotion-accent,var(--accent-primary))"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-10 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6">
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Behaviour pattern table
        </h2>
        <table className="mt-6 w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-[var(--text-muted)]">
              <th className="border-b border-[var(--border)] p-3 font-mono-label text-xs uppercase tracking-wide">
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center gap-1 text-[var(--text-secondary)]"
                  onClick={() => toggleSort("logged_at")}
                >
                  Date
                  {sortKey === "logged_at" ? (
                    sortDir === "asc" ? (
                      <CaretUp aria-hidden size={16} />
                    ) : (
                      <CaretDown aria-hidden size={16} />
                    )
                  ) : null}
                </button>
              </th>
              <th className="border-b border-[var(--border)] p-3 font-mono-label text-xs uppercase tracking-wide">
                Time
              </th>
              <th className="border-b border-[var(--border)] p-3 font-mono-label text-xs uppercase tracking-wide">
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center gap-1 text-[var(--text-secondary)]"
                  onClick={() => toggleSort("emotion")}
                >
                  Emotion
                  {sortKey === "emotion" ? (
                    sortDir === "asc" ? (
                      <CaretUp aria-hidden size={16} />
                    ) : (
                      <CaretDown aria-hidden size={16} />
                    )
                  ) : null}
                </button>
              </th>
              <th className="border-b border-[var(--border)] p-3 font-mono-label text-xs uppercase tracking-wide">
                Activity
              </th>
              <th className="border-b border-[var(--border)] p-3 font-mono-label text-xs uppercase tracking-wide">
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center gap-1 text-[var(--text-secondary)]"
                  onClick={() => toggleSort("energy_level")}
                >
                  Energy
                  {sortKey === "energy_level" ? (
                    sortDir === "asc" ? (
                      <CaretUp aria-hidden size={16} />
                    ) : (
                      <CaretDown aria-hidden size={16} />
                    )
                  ) : null}
                </button>
              </th>
              <th className="border-b border-[var(--border)] p-3 font-mono-label text-xs uppercase tracking-wide">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.logged_at}
                className="transition-colors duration-[var(--motion-duration)] ease-out hover:bg-[var(--glow)]"
              >
                <td className="border-b border-[var(--border)] p-3 font-mono-label text-xs text-[var(--text-secondary)]">
                  {new Date(row.logged_at).toLocaleDateString()}
                </td>
                <td className="border-b border-[var(--border)] p-3 font-mono-label text-xs text-[var(--text-secondary)]">
                  {new Date(row.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="border-b border-[var(--border)] p-3 text-[var(--emotion-text,var(--text-primary))]">
                  {row.emotion}
                </td>
                <td className="border-b border-[var(--border)] p-3 text-[var(--text-secondary)]">
                  {(row.time_of_day ?? "") +
                    (row.activities?.length ? ` · ${row.activities.join(", ")}` : "")}
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
      </section>

      <section className="mt-10 mb-10 rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-elevated))] p-6">
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Monthly narrative
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]" aria-live="polite">
          {loading ? (
            <p className="emosense-pulse">Drafting monthly overview…</p>
          ) : (
            <p className="whitespace-pre-line">{narrative}</p>
          )}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6">
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Evaluation metrics
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          These are the real metrics to collect before claiming clinical-grade performance.
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
      </section>

      <section className="mt-10 mb-10 rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6">
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Bigger upgrade roadmap
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          These upgrades are high value, but they need more design, privacy review, testing, and backend work before implementation.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {futureUpgradeRoadmap.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4"
            >
              <h3 className="font-body text-sm font-semibold text-[var(--emotion-text,var(--text-primary))]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
