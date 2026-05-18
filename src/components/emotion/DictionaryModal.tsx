"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import EmotionChip from "@/src/components/ui/EmotionChip";
import { applyEmotionTheme, getTheme } from "@/src/lib/emotionTheme";
import { emotions, type EmotionRecord } from "@/data/emotions";

type DictionaryModalProps = {
  emotion: EmotionRecord;
  onClose: () => void;
  onPickRelated: (emotion: EmotionRecord) => void;
};

export default function DictionaryModal({
  emotion,
  onClose,
  onPickRelated,
}: DictionaryModalProps) {
  const theme = getTheme(emotion.themeKey);

  useEffect(() => {
    applyEmotionTheme(emotion.themeKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [emotion.themeKey]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onMouseDown={onClose}
          aria-hidden
        />
        <motion.div
          role="dialog"
          aria-modal
          aria-labelledby="dictionary-modal-title"
          data-emotion={theme.dataAttr}
          className="relative z-10 max-h-[min(100dvh,900px)] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 shadow-2xl sm:rounded-2xl"
          style={{
            backgroundColor: "var(--emotion-bg)",
            color: "var(--emotion-text)",
            transition: "background-color 600ms ease-out, color 600ms ease-out",
          }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-2xl opacity-70 hover:opacity-100"
            style={{ color: "var(--emotion-text)" }}
            aria-label="Close"
          >
            ×
          </button>

          <div className="flex flex-col items-center pt-4">
            <EmotionFace emotion={emotion.themeKey} size="lg" animated />
            <h2
              id="dictionary-modal-title"
              className="mt-6 font-display text-[32px] font-bold"
              style={{ color: "var(--emotion-text)" }}
            >
              {emotion.name}
            </h2>
            <p className="mt-2 font-body text-base opacity-60">
              {emotion.phonetic}
            </p>
          </div>

          <p className="mt-6 font-body text-base leading-relaxed opacity-90">
            {emotion.definition}
          </p>

          <section className="mt-8">
            <h3 className="font-display text-lg font-bold">
              Your body might feel
            </h3>
            <ul className="mt-3 space-y-2 font-body text-sm opacity-90">
              {emotion.bodyFeelings.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-lg font-bold">What helps</h3>
            <ul className="mt-3 space-y-2 font-body text-sm">
              {emotion.strategies.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2">
                  <span style={{ color: "var(--emotion-accent)" }} aria-hidden>
                    ✓
                  </span>
                  <span className="opacity-90">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-lg font-bold">
              Related emotions
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {emotion.related.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const next = emotions.find(
                      (e) =>
                        e.name.toLowerCase() === name.toLowerCase() ||
                        e.name.toLowerCase().startsWith(name.toLowerCase()),
                    );
                    if (next) onPickRelated(next);
                  }}
                  className="min-h-[44px] rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <EmotionChip emotion={name} size="sm" />
                </button>
              ))}
            </div>
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
