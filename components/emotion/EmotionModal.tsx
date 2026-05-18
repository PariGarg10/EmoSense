"use client";

import Modal from "@/components/ui/Modal";
import FaceIllustration from "@/components/emotion/FaceIllustration";
import type { EmotionRecord } from "@/data/emotions";
import { Heartbeat, Brain, HandPalm } from "@phosphor-icons/react";

type EmotionModalProps = {
  emotion: EmotionRecord | null;
  onClose: () => void;
  onPickRelated: (name: string) => void;
};

const bodyIcons = [Heartbeat, HandPalm, Brain];

export default function EmotionModal({ emotion, onClose, onPickRelated }: EmotionModalProps) {
  if (!emotion) return null;

  const titleId = `emotion-modal-${emotion.id}`;

  return (
    <Modal open onClose={onClose} titleId={titleId}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors duration-[var(--motion-duration)] ease-out hover:text-[var(--text-primary)]"
        aria-label="Close emotion details"
      >
        <span aria-hidden>×</span>
      </button>

      <div className="pr-12">
        <div className="mx-auto h-36 w-36">
          <FaceIllustration variant={emotion.face} title={`${emotion.name} face`} className="h-full w-full" />
        </div>

        <h2 id={titleId} className="mt-4 font-display text-3xl font-extrabold text-[var(--text-primary)]">
          {emotion.name}
        </h2>
        <p className="font-mono-label text-sm text-[var(--text-muted)]">Sounds like: {emotion.phonetic}</p>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">{emotion.description}</p>
      </div>

      <section className="mt-8">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">What your body might feel</h3>
        <ul className="mt-4 space-y-3">
          {emotion.body.map((item, idx) => {
            const Icon = bodyIcons[idx % bodyIcons.length];
            return (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-secondary)]"
              >
                <Icon className="mt-0.5 shrink-0 text-[var(--accent-primary)]" size={22} aria-hidden />
                <span>{item}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">When you might feel this</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {emotion.situations.map((item) => (
            <div
              key={item}
              className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-secondary)]"
            >
              <svg className="pointer-events-none absolute inset-0 -z-0 opacity-40" aria-hidden viewBox="0 0 200 120">
                <defs>
                  <linearGradient id={`g-${emotion.id}`} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <rect width="200" height="120" fill={`url(#g-${emotion.id})`} />
              </svg>
              <span className="relative z-10">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">What helps</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {emotion.helps.map((item) => (
            <li
              key={item}
              className="rounded-full border border-[var(--accent-soft)]/40 bg-[rgba(126,200,164,0.12)] px-4 py-2 text-sm text-[var(--text-primary)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Related emotions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {emotion.related.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onPickRelated(name)}
              className="min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--accent-primary)] transition-colors duration-[var(--motion-duration)] ease-out hover:bg-[var(--glow)]"
            >
              {name}
            </button>
          ))}
        </div>
      </section>
    </Modal>
  );
}
