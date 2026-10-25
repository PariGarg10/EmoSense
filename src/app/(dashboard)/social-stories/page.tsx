"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { SpeakerHigh, Stop } from "@phosphor-icons/react";

type Story = {
  title: string;
  tag: "School" | "Home" | "Mealtime" | "Community" | "Friends";
  feeling: string;
  steps: string[];
};

const stories: Story[] = [
  {
    title: "Loud assembly hall",
    tag: "School",
    feeling: "Anxiety",
    steps: [
      "Many people are talking at once. The room can feel very loud.",
      "It is okay if the noise feels too big for my body.",
      "I can move to the side, or use ear defenders.",
      "I can ask a teacher for a written plan of what happens next.",
    ],
  },
  {
    title: "Trying a new food",
    tag: "Mealtime",
    feeling: "Surprise",
    steps: [
      "New textures and smells can feel surprising.",
      "I can look at the food first, then smell it.",
      "I can touch a tiny bit, or taste a tiny bit, if I want to.",
      "I can always choose my safe backup snack.",
    ],
  },
  {
    title: "When the schedule changes",
    tag: "Home",
    feeling: "Confused",
    steps: [
      "Sometimes plans change, even when I expected them to stay the same.",
      "Changes can feel like a puzzle. It is okay to feel upset.",
      "I can ask for one new step at a time.",
      "I can write the new order on paper and check it when I need to.",
    ],
  },
  {
    title: "Going to the doctor",
    tag: "Community",
    feeling: "Fear",
    steps: [
      "The doctor helps keep my body healthy.",
      "The waiting room may have bright lights and other people.",
      "I can bring a comfort item or headphones.",
      "The doctor will tell me what they are going to do before they do it. I can ask them to explain.",
    ],
  },
  {
    title: "Joining a game",
    tag: "Friends",
    feeling: "Joy",
    steps: [
      "Other children are playing a game I like.",
      "I can watch for a moment to learn the rules.",
      "I can ask, “Can I play too?”",
      "If they say not now, I can try again later or find another activity.",
    ],
  },
  {
    title: "When someone says no",
    tag: "Friends",
    feeling: "Sadness",
    steps: [
      "Sometimes I ask for something and the answer is no.",
      "Feeling disappointed or sad is okay.",
      "I can take three slow breaths.",
      "I can ask, “When can I try again?” or choose something else.",
    ],
  },
  {
    title: "Feeling angry at home",
    tag: "Home",
    feeling: "Anger",
    steps: [
      "My body may feel hot and my hands may want to squeeze.",
      "Anger is a feeling. It tells me something feels unfair.",
      "I can go to my calm spot and squeeze a pillow.",
      "When my body is calmer, I can tell someone what happened.",
    ],
  },
  {
    title: "A busy supermarket",
    tag: "Community",
    feeling: "Anxiety",
    steps: [
      "The supermarket can be bright, busy, and noisy.",
      "I can help by holding the list or pushing the trolley.",
      "If it gets too much, I can tell my grown-up “I need a break.”",
      "We can step outside for a few minutes, then decide what to do.",
    ],
  },
];

const TAGS = ["All", "School", "Home", "Mealtime", "Community", "Friends"] as const;

export default function SocialStoriesPage() {
  const [tag, setTag] = useState<(typeof TAGS)[number]>("All");
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const visible = useMemo(
    () => (tag === "All" ? stories : stories.filter((s) => s.tag === tag)),
    [tag],
  );

  function toggleSpeak(story: Story) {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking === story.title) {
      setSpeaking(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${story.title}. ${story.steps.join(" ")}`);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = () => setSpeaking(null);
    setSpeaking(story.title);
    synth.speak(utterance);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <h1 className="font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
          Social stories
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--text-secondary)]">
          Short scenes in calm, step-by-step language. Read them before a new situation, or listen with read aloud.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter stories">
        {TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            aria-pressed={tag === t}
            className={clsx(
              "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors",
              tag === t
                ? "border-[var(--emotion-accent,var(--accent-primary))] bg-[var(--glow)] text-[var(--text-primary)]"
                : "border-[var(--border)] text-[var(--text-secondary)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {visible.map((story) => (
          <article
            key={story.title}
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface,var(--bg-surface))] p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)]">
                  {story.tag}
                </span>
                <h2 className="mt-3 font-display text-xl font-bold text-[var(--text-primary)]">{story.title}</h2>
              </div>
              {canSpeak && (
                <button
                  type="button"
                  onClick={() => toggleSpeak(story)}
                  className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-pressed={speaking === story.title}
                >
                  {speaking === story.title ? <Stop size={18} aria-hidden /> : <SpeakerHigh size={18} aria-hidden />}
                  {speaking === story.title ? "Stop" : "Read aloud"}
                </button>
              )}
            </div>
            <ol className="mt-4 flex-1 space-y-3">
              {story.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-primary)]"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href={`/emotion-dictionary?q=${encodeURIComponent(story.feeling)}`}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--accent-primary)] px-5 text-base font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--glow)]"
            >
              Learn about this feeling
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
