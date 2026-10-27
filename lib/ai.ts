"use server";

import type { LogEntry } from "@/lib/types";
import {
  explainEmotion as explainEmotionImpl,
  generateWeeklyInsights as generateWeeklyInsightsImpl,
} from "@/src/lib/ai";

export async function explainEmotion(
  emotion: string,
  confidence: number,
): Promise<string> {
  return explainEmotionImpl(String(emotion ?? ""), Number(confidence));
}

export async function generateWeeklyInsights(
  logEntries: LogEntry[] | object[],
): Promise<string> {
  return generateWeeklyInsightsImpl(logEntries);
}
