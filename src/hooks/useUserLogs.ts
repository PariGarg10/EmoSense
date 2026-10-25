"use client";

import { useCallback, useEffect, useState } from "react";
import { useEmoSenseStore } from "@/lib/store";
import {
  listBehaviourLogs,
  listEmotionLogs,
  subscribeLogs,
  type BehaviourLogRow,
  type EmotionLogRow,
} from "@/src/lib/logRepository";

/** Emotion + behaviour logs for the signed-in user; refreshes on any write. */
export function useUserLogs() {
  const userId = useEmoSenseStore((s) => s.user?.id);
  const [emotionLogs, setEmotionLogs] = useState<EmotionLogRow[]>([]);
  const [behaviourLogs, setBehaviourLogs] = useState<BehaviourLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEmotionLogs([]);
      setBehaviourLogs([]);
      setLoading(false);
      return;
    }
    const [emotions, behaviours] = await Promise.all([
      listEmotionLogs(userId),
      listBehaviourLogs(userId),
    ]);
    setEmotionLogs(emotions);
    setBehaviourLogs(behaviours);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
    return subscribeLogs(() => void refresh());
  }, [refresh]);

  return { userId, emotionLogs, behaviourLogs, loading, refresh };
}
