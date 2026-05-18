"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@/components/ui/Button";
import EmotionChip from "@/components/ui/EmotionChip";
import { explainEmotion } from "@/lib/ai";
import type { FaceExpressions } from "@/lib/types";
import { Smiley, WarningCircle } from "@phosphor-icons/react";

type Props = {
  dominant: string;
  confidencePct: number;
  expressions: FaceExpressions | null;
  onSaveToLog?: () => void;
};

const labelMap: Record<string, string> = {
  neutral: "Calm",
  happy: "Joy",
  sad: "Sadness",
  angry: "Anger",
  fearful: "Fear",
  surprised: "Surprise",
  disgusted: "Disgust",
};

export default function EmotionResultsPanel({
  dominant,
  confidencePct,
  expressions,
  onSaveToLog,
}: Props) {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const text = await explainEmotion(dominant, confidencePct);
        if (!cancelled) setExplanation(text);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dominant, confidencePct]);

  const chartData =
    expressions == null
      ? []
      : Object.entries(expressions).map(([key, value]) => ({
          name: labelMap[key] ?? key,
          score: Math.round(value * 100),
        }));

  return (
    <div className="mt-6 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[0_-8px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--accent-primary)]">
            <Smiley size={28} weight="duotone" aria-hidden />
          </span>
          <div>
            <p className="font-mono-label text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Dominant read
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <EmotionChip emotion={dominant} size="lg" />
              <span className="font-mono-label text-sm text-[var(--text-secondary)]">
                Confidence {confidencePct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
          All expression scores (bar length and label)
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(91,141,239,0.08)" }}
              contentStyle={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text-primary)",
              }}
            />
            <Bar dataKey="score" fill="var(--accent-primary)" radius={[0, 8, 8, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <section aria-live="polite" className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-start gap-3">
          <WarningCircle className="mt-0.5 shrink-0 text-[var(--accent-warm)]" size={22} aria-hidden />
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
              What this might mean
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              This text is a guess based on pixels. It is not a diagnosis.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {loading ? (
                <span className="emosense-pulse">Preparing a gentle explanation…</span>
              ) : (
                explanation
              )}
            </p>
          </div>
        </div>
      </section>

      {onSaveToLog && (
        <Button type="button" onClick={onSaveToLog} className="w-full sm:w-auto">
          Save to log
        </Button>
      )}
    </div>
  );
}
