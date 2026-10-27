"use server";

import type { LogEntry, UserRole } from "@/lib/types";
import {
  explainEmotion as explainEmotionImpl,
  generateMonthlyReport as generateMonthlyReportImpl,
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

export async function generateMonthlyReport(
  entries: LogEntry[],
  role: UserRole,
): Promise<string> {
  const safeRole: UserRole =
    role === "caregiver" || role === "therapist" ? role : "user";
  return generateMonthlyReportImpl(entries, safeRole);
}
