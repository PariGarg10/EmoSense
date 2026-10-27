import { askClaude } from "@/src/lib/claude";

const MAX_LOGS = 120;
const MAX_FIELD = 300;

/** Trim client-supplied log objects so prompts stay small and bounded. */
export function sanitizeLogs(logs: unknown): Record<string, unknown>[] {
  if (!Array.isArray(logs)) return [];
  return logs.slice(0, MAX_LOGS).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value.slice(0, MAX_FIELD);
      else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
      else if (Array.isArray(value)) {
        out[key] = value
          .filter((v): v is string => typeof v === "string")
          .slice(0, 10)
          .map((v) => v.slice(0, 60));
      }
    }
    return [out];
  });
}

function countBy<T>(items: T[], key: (item: T) => string | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Deterministic summary used when Claude is unavailable. */
export function localInsights(logs: Record<string, unknown>[]): string {
  if (logs.length === 0) {
    return [
      "• 🌤️ No logs yet this week. Save a check-in or a mood entry to start seeing patterns.",
      "• 📓 Try noting the time of day with each entry.",
      "• 🌿 When you feel steady, write what helped.",
    ].join("\n");
  }

  const lines: string[] = [];
  const emotions = countBy(logs, (l) => str(l.emotion));
  const [topEmotion, topCount] = emotions[0] ?? [];
  if (topEmotion) {
    lines.push(
      `• 📊 ${topEmotion} was logged most often (${topCount} of ${logs.length} entries).`,
    );
  }

  const times = countBy(logs, (l) => str(l.time_of_day));
  if (times[0]) {
    lines.push(`• 🕒 Most entries were in the ${times[0][0].toLowerCase()}.`);
  }

  const activities = countBy(
    logs.flatMap((l) => (Array.isArray(l.activities) ? (l.activities as string[]) : [])),
    (a) => a,
  );
  if (activities[0]) {
    lines.push(`• 🧩 ${activities[0][0]} came up most as an activity.`);
  }

  const energies = logs
    .map((l) => (typeof l.energy_level === "number" ? l.energy_level : null))
    .filter((v): v is number => v != null);
  if (energies.length) {
    const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
    lines.push(`• 🔋 Average energy was ${avg.toFixed(1)} out of 5.`);
  }

  const withNotes = logs.filter((l) => str(l.note)).length;
  lines.push(
    withNotes < logs.length / 2
      ? "• 📝 Adding a short note to more entries will make patterns easier to see."
      : "• 🌿 Your notes give helpful context. Keep writing what helped.",
  );

  return lines.join("\n");
}

export async function explainEmotion(
  emotion: string,
  confidence: number,
): Promise<string> {
  const label = (emotion || "this feeling").slice(0, 40);
  const pct = Number.isFinite(confidence) ? Math.round(confidence) : 0;

  const text = await askClaude({
    system:
      "You explain emotions to autistic individuals. Use simple words (max grade 4 reading level). No idioms, no sarcasm, no ambiguous phrases. Be warm, calm, and specific. Never say 'normal' or 'weird'. Respond in exactly 3 short sentences.",
    messages: [
      {
        role: "user",
        content: `A face scan shows ${label} at ${pct}% confidence. What is this emotion and what can cause it?`,
      },
    ],
  });

  return (
    text ??
    `The scan points to ${label}. Faces can look many ways for many reasons. If you feel unsure, take a break and check in with someone you trust.`
  );
}

export async function generateWeeklyInsights(logs: unknown): Promise<string> {
  const clean = sanitizeLogs(logs);
  if (clean.length === 0) return localInsights(clean);

  const text = await askClaude({
    system:
      "Help caregivers and autistic users understand behaviour patterns. Plain English, kind and factual. Reply with 3-5 bullet points, one per line, each starting with '• ' and an emoji. Base every point on the logs given; do not invent events.",
    messages: [{ role: "user", content: `This week's logs (JSON): ${JSON.stringify(clean)}` }],
  });
  return text ?? localInsights(clean);
}
