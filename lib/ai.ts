"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { LogEntry } from "@/lib/types";
import {
  explainEmotion as explainEmotionImpl,
  generateWeeklyInsights as generateWeeklyInsightsImpl,
} from "@/src/lib/ai";

const MODEL = "claude-sonnet-4-20250514";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return null;
  }
  return new Anthropic({ apiKey: key });
}

export async function explainEmotion(
  emotion: string,
  confidence: number,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return (
      "The scan points to " +
      emotion +
      ". Faces can look many ways for many reasons. " +
      "If you feel unsure, take a break and check in with someone you trust."
    );
  }
  return explainEmotionImpl(emotion, confidence);
}

export async function generateWeeklyInsights(
  logEntries: LogEntry[] | object[],
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return (
      "• 🌤️ Add a few more logs to see clearer patterns.\n" +
      "• 📓 Try noting the time of day with each entry.\n" +
      "• 🌿 When you feel steady, write what helped."
    );
  }
  return generateWeeklyInsightsImpl(
    Array.isArray(logEntries) ? logEntries : [],
  );
}

export async function generateMonthlyReport(
  entries: LogEntry[],
  role: "caregiver" | "therapist",
): Promise<string> {
  const client = getClient();
  const userPrompt = `Role: ${role}. Monthly logs (JSON): ${JSON.stringify(
    entries,
  )}`;

  if (!client) {
    return (
      "Overview: Sample data is shown until Supabase logging is connected.\n\n" +
      "Patterns: Mood shifts often cluster around school days and evenings.\n\n" +
      "Recommendations: Keep short daily notes and review trends weekly with the care team."
    );
  }

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system:
      "Generate a clinical-style monthly summary. Use objective language. Note patterns, triggers, and positive trends. Format: Overview paragraph + Patterns section + Recommendations.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text.trim();
  }
  return "Overview: Insufficient model output.";
}
