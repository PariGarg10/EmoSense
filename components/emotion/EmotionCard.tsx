"use client";

import FaceIllustration from "@/components/emotion/FaceIllustration";
import type { EmotionRecord } from "@/data/emotions";

type EmotionCardProps = {
  emotion: EmotionRecord;
};

export default function EmotionCard({ emotion }: EmotionCardProps) {
  return (
    <article
      className="
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--bg-surface)]
        p-6
        text-left
        transition-all
        duration-[var(--motion-duration)]
        ease-out
        hover:-translate-y-0.5
        hover:border-[rgba(91,141,239,0.4)]
        hover:shadow-[var(--shadow-glow)]
      "
      style={{ borderLeftWidth: 4, borderLeftColor: emotion.color }}
    >
      <div className="mx-auto h-28 w-28">
        <FaceIllustration variant={emotion.face} title={`${emotion.name} illustration`} className="h-full w-full" />
      </div>

      <div className="mt-6">
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{emotion.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{emotion.description}</p>
      </div>
    </article>
  );
}
