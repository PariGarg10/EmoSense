"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import DictionaryEmotionCard from "@/src/components/emotion/DictionaryEmotionCard";
import DictionaryModal from "@/src/components/emotion/DictionaryModal";
import { applyEmotionTheme } from "@/src/lib/emotionTheme";
import { fetchLastEmotionLog } from "@/src/lib/emotionLogs";
import { useEmoSenseStore } from "@/lib/store";
import {
  EMOTION_FILTERS,
  emotions,
  type EmotionFamily,
  type EmotionRecord,
} from "@/data/emotions";

export default function EmotionDictionaryPage() {
  const user = useEmoSenseStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<EmotionFamily>("All");
  const [selected, setSelected] = useState<EmotionRecord | null>(null);
  const hoverThemeRef = useRef<string | null>(null);
  const lastLoggedThemeRef = useRef<string>("neutral");

  const restoreTheme = useCallback(async () => {
    if (user?.id) {
      const last = await fetchLastEmotionLog(user.id);
      if (last?.emotion) {
        applyEmotionTheme(last.emotion);
        lastLoggedThemeRef.current = last.emotion;
        return;
      }
    }
    applyEmotionTheme("neutral");
    lastLoggedThemeRef.current = "neutral";
  }, [user?.id]);

  useEffect(() => {
    void restoreTheme();
  }, [restoreTheme]);

  const filtered = useMemo(() => {
    return emotions.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesText =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q);
      const matchesFamily = family === "All" || e.category === family;
      return matchesText && matchesFamily;
    });
  }, [search, family]);

  const handleHoverTheme = (key: string | null) => {
    hoverThemeRef.current = key;
    if (!key) {
      if (!selected) void restoreTheme();
      return;
    }
    if (!selected) applyEmotionTheme(key);
  };

  const openModal = (emotion: EmotionRecord) => {
    setSelected(emotion);
    applyEmotionTheme(emotion.themeKey);
  };

  const closeModal = () => {
    setSelected(null);
    void restoreTheme();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 transition-[background-color,color] duration-[600ms] ease-out">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Emotion dictionary
        </h1>
        <p className="mt-2 font-body text-base text-[var(--text-secondary)]">
          Learn feelings with plain words, body cues, and calming ideas.
        </p>
      </header>

      <label htmlFor="emotion-search" className="sr-only">
        Search emotions
      </label>
      <input
        id="emotion-search"
        type="search"
        placeholder="Search an emotion..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 font-display text-lg text-[var(--text-primary)] transition-[border-color] duration-300 placeholder:text-[var(--text-muted)] focus:border-[var(--emotion-accent,#5B8DEF)] focus:outline-none"
      />

      <div className="flex flex-wrap gap-2" aria-label="Emotion filters">
        {EMOTION_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFamily(f)}
            className={clsx(
              "min-h-[44px] rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-300",
              family === f
                ? "bg-[var(--emotion-accent,#5B8DEF)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {filtered.map((emotion) => (
          <DictionaryEmotionCard
            key={emotion.id}
            emotion={emotion}
            onSelect={() => openModal(emotion)}
            onHoverTheme={handleHoverTheme}
          />
        ))}
      </div>

      {selected && (
        <DictionaryModal
          emotion={selected}
          onClose={closeModal}
          onPickRelated={(next) => setSelected(next)}
        />
      )}
    </div>
  );
}
