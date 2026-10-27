"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowClockwise, Sparkle } from "@phosphor-icons/react";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import { generateWeeklyInsights } from "@/lib/ai";
import type { LogEntry } from "@/lib/types";

function toBullets(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean)
    .map((l) => (l.startsWith("•") ? l : `• ${l}`));
}

export default function BehaviourInsightsCard({
  logs,
  ready = true,
}: {
  logs: LogEntry[];
  ready?: boolean;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // Only regenerate when the set of entries actually changes.
  const signature = useMemo(
    () => `${logs.length}:${logs[0]?.logged_at ?? ""}:${nonce}`,
    [logs, nonce],
  );

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    generateWeeklyInsights(logs)
      .then((res) => {
        if (!cancelled) setText(res);
      })
      .catch(() => {
        if (!cancelled) setText("• 🌿 Insights are not available right now. Your logs are still saved.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, ready]);

  const bullets = toBullets(text);

  async function sharePdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EmoSense — Weekly insights", 14, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), 14, 27);
    doc.setFontSize(11);
    let y = 38;
    for (const line of bullets) {
      // jsPDF's default font cannot render emoji.
      const plain = line.replace(/^•\s*/, "").replace(/[^\x20-\x7E -ɏ]/g, "").trim();
      const rows = doc.splitTextToSize(plain, 175) as string[];
      rows.forEach((row, i) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${i === 0 ? "•" : " "} ${row}`, 14, y);
        y += 7;
      });
    }
    doc.save("emosense-weekly-insights.pdf");
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Sparkle className="text-[var(--accent-warm)]" size={28} weight="duotone" aria-hidden />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            Weekly insights
          </h2>
          <p className="font-body text-sm text-[var(--text-secondary)]">
            Gentle notes from your last 7 days ({logs.length} {logs.length === 1 ? "entry" : "entries"})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          aria-label="Refresh insights"
        >
          <ArrowClockwise size={20} aria-hidden />
        </button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <>
            <div className="h-14 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
          </>
        ) : (
          bullets.map((line, i) => (
            <p
              key={`${i}-${line}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 font-body text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {line}
            </p>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-6 w-full md:w-auto"
        disabled={loading || bullets.length === 0}
        onClick={() => void sharePdf()}
      >
        Download PDF for your therapist
      </Button>
    </Card>
  );
}
