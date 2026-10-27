import {
  addEmotionLog,
  listEmotionLogs,
  type EmotionLogRow,
} from "@/src/lib/logRepository";

export type { EmotionLogRow };

export async function fetchLastEmotionLog(
  userId: string,
): Promise<EmotionLogRow | null> {
  const [last] = await listEmotionLogs(userId, { limit: 1 });
  return last ?? null;
}

export const insertEmotionLog = addEmotionLog;
