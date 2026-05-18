"use client";

import { useState } from "react";
import EmotionCard from "./EmotionCard";
import EmotionModal from "./EmotionModal";
import type { EmotionRecord } from "@/data/emotions";

type EmotionGridProps = {
  emotions: EmotionRecord[];
};

export default function EmotionGrid({ emotions }: EmotionGridProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionRecord | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {emotions.map((emotion) => (
          <button
            key={emotion.id}
            type="button"
            onClick={() => setSelectedEmotion(emotion)}
            className="w-full rounded-xl text-left focus-visible:outline focus-visible:outline-offset-2"
          >
            <EmotionCard emotion={emotion} />
          </button>
        ))}
      </div>

      {selectedEmotion && (
        <EmotionModal
          emotion={selectedEmotion}
          onClose={() => setSelectedEmotion(null)}
          onPickRelated={(name) => {
            const next = emotions.find((e) => e.name === name);
            if (next) setSelectedEmotion(next);
          }}
        />
      )}
    </>
  );
}
