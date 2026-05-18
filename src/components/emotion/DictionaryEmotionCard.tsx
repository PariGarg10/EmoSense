"use client";

import { motion } from "framer-motion";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import { applyEmotionTheme, getTheme } from "@/src/lib/emotionTheme";
import type { EmotionRecord } from "@/data/emotions";

type DictionaryEmotionCardProps = {
  emotion: EmotionRecord;
  onSelect: () => void;
  onHoverTheme: (key: string | null) => void;
};

export default function DictionaryEmotionCard({
  emotion,
  onSelect,
  onHoverTheme,
}: DictionaryEmotionCardProps) {
  const accent = getTheme(emotion.themeKey).accentColor;

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseEnter={() => {
        applyEmotionTheme(emotion.themeKey);
        onHoverTheme(emotion.themeKey);
      }}
      onMouseLeave={() => onHoverTheme(null)}
      onFocus={() => {
        applyEmotionTheme(emotion.themeKey);
        onHoverTheme(emotion.themeKey);
      }}
      onBlur={() => onHoverTheme(null)}
      className="flex h-full cursor-pointer flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-left transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--emotion-accent)_25%,transparent)]"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
      whileHover={{ y: -4 }}
    >
      <div className="mx-auto flex justify-center">
        <EmotionFace emotion={emotion.themeKey} size="md" animated={false} />
      </div>
      <h3 className="mt-4 text-center font-display text-lg font-bold text-[var(--text-primary)]">
        {emotion.name}
      </h3>
      <p className="mt-2 line-clamp-3 text-center font-body text-sm text-[var(--text-secondary)]">
        {emotion.definition}
      </p>
    </motion.article>
  );
}
