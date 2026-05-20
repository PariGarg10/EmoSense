"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useEmoSenseStore } from "@/lib/store";
import { insertEmotionLog } from "@/src/lib/emotionLogs";

function ScanLoadingFallback() {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,#161C26)]"
      style={{ minHeight: 300 }}
    >
      <p className="font-body text-base text-[var(--text-secondary)]">
        Setting up face reader...
      </p>
      <span
        className="h-3 w-3 rounded-full bg-[var(--emotion-accent,#5B8DEF)] animate-pulse"
        aria-hidden
      />
    </div>
  );
}

const FaceScanner = dynamic(
  () => import("@/components/emotion/FaceScanner"),
  { ssr: false, loading: () => <ScanLoadingFallback /> },
);

export default function EmotionScanPage() {
  const user = useEmoSenseStore((s) => s.user);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const setCurrentEmotion = useEmoSenseStore((s) => s.setCurrentEmotion);
  const recordDailyEmotion = useEmoSenseStore((s) => s.recordDailyEmotion);
  const [detected, setDetected] = useState(false);

  const handleResult = async (emotion: string, confidence: number) => {
    setDetected(true);
    setCurrentEmotion(emotion);
    recordDailyEmotion(emotion, "scan");

    if (user?.id) {
      await insertEmotionLog({
        userId: user.id,
        emotion,
        source: "scan",
        confidence,
      });
    }

    addToast({ variant: "success", message: "Saved to your log" });
  };

  return (
    <div
      className="mx-auto max-w-2xl space-y-8 transition-[background-color,color] duration-[600ms] ease-out"
    >
      <header>
        <h1
          className="font-display text-[32px] font-bold transition-colors duration-[600ms] ease-out"
          style={{
            color: detected
              ? "var(--emotion-text, var(--text-primary))"
              : "var(--text-primary)",
          }}
        >
          Read a face
        </h1>
        <p className="mt-2 font-body text-base text-[var(--text-secondary)] transition-colors duration-[600ms] ease-out">
          Point a camera or upload a photo
        </p>
      </header>

      <FaceScanner onResult={(e, c) => void handleResult(e, c)} />
    </div>
  );
}