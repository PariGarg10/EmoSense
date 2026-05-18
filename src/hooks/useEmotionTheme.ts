"use client";

import { useEffect, useMemo } from "react";
import {
  applyEmotionTheme,
  clearEmotionTheme,
  getTheme,
} from "@/src/lib/emotionTheme";

export function useEmotionTheme(emotion: string) {
  const theme = useMemo(() => getTheme(emotion.trim()), [emotion]);

  useEffect(() => {
    const trimmed = emotion.trim();
    if (!trimmed) {
      clearEmotionTheme();
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      const previous = document.body.style.transition;
      document.body.style.transition = "none";
      applyEmotionTheme(trimmed);
      void document.body.offsetHeight;
      document.body.style.transition = previous;
    } else {
      applyEmotionTheme(trimmed);
    }
  }, [emotion]);

  useEffect(() => {
    return () => {
      clearEmotionTheme();
    };
  }, []);

  return theme;
}
