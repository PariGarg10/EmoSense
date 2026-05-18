"use client";

import { useEffect } from "react";
import { useEmoSenseStore } from "@/lib/store";

export default function SensoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sensory = useEmoSenseStore((s) => s.sensory);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.font = sensory.fontSize;
    root.dataset.contrast = sensory.contrast;
    root.dataset.motion = sensory.motion;
    root.dataset.theme = sensory.theme;

    const fontMap = {
      sm: "0.875",
      md: "1",
      lg: "1.125",
      xl: "1.25",
    } as const;
    root.style.setProperty("--font-scale", fontMap[sensory.fontSize]);
  }, [sensory]);

  return children;
}
