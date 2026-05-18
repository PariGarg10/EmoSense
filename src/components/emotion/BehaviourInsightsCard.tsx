"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { Sparkle } from "@phosphor-icons/react";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import { generateWeeklyInsights } from "@/lib/ai";
import type { LogEntry } from "@/lib/types";

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

function toBullets(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith("•") ? l : `• ${l}`));
}

export default function BehaviourInsightsCard() {
  const [text, setText] = useState("");
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
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const bullets = toBullets(text);

  function sharePdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EmoSense — Weekly insights", 14, 20);
    doc.setFontSize(11);
    let y = 32;
    for (const line of bullets) {
      const rows = doc.splitTextToSize(line.replace(/^•\s*/, ""), 180);
      for (const row of rows) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`• ${row}`, 14, y);
        y += 7;
      }
    }
    doc.save("emosense-weekly-insights.pdf");
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Sparkle
          className="text-[var(--accent-warm)]"
          size={28}
          weight="duotone"
          aria-hidden
        />
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            Weekly insights
          </h2>
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Gentle notes from your recent logs
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        {loading ? (
          <>
            <div className="h-14 animate-pulse rounded-xl bg-[var(--emotion-surface,#161C26)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[var(--emotion-surface,#161C26)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[var(--emotion-surface,#161C26)]" />
          </>
        ) : (
          bullets.map((line) => (
            <p
              key={line}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 font-body text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {line.match(/^•/) ? line : `• ${line}`}
            </p>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-6 w-full md:w-auto"
        disabled={loading || bullets.length === 0}
        onClick={sharePdf}
      >
        Share with therapist
      </Button>
    </Card>
  );
}
