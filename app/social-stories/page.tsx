"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

const stories = [
  {
    title: "Loud assembly hall",
    body: "Many people talking at once. You can move to the side, use ear defenders, and ask for a written plan.",
    tag: "School",
  },
  {
    title: "Trying a new food",
    body: "New textures can feel surprising. You may smell first, touch a tiny bit, or choose a safe backup snack.",
    tag: "Mealtime",
  },
  {
    title: "When the schedule changes",
    body: "Changes can feel like a puzzle. Ask for one new step at a time and write the order on paper if that helps.",
    tag: "Home",
  },
];

export default function SocialStoriesPage() {
  return (
    <AppShell>
      <header>
        <h1 className="font-display text-4xl font-bold text-[var(--text-primary)] md:text-5xl">Social Stories</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--text-secondary)]">
          Short scenes with calm language. Each card pairs words with a simple illustration.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        {stories.map((story, index) => (
          <article
            key={story.title}
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition-transform duration-[var(--motion-duration)] ease-out hover:-translate-y-0.5 hover:border-[rgba(91,141,239,0.4)]"
          >
            <div className="relative h-28 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-base)]">
              <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
                <defs>
                  <linearGradient id={`ss-${index}`} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <rect width="200" height="120" fill={`url(#ss-${index})`} />
                <circle cx="70" cy="60" r="18" fill="var(--bg-elevated)" stroke="var(--border)" />
                <circle cx="130" cy="60" r="18" fill="var(--bg-elevated)" stroke="var(--border)" />
              </svg>
              <span className="absolute left-3 top-3 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-mono-label text-[var(--text-secondary)]">
                {story.tag}
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-[var(--text-primary)]">{story.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{story.body}</p>
            <Link
              href="/emotion-dictionary"
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--accent-primary)] px-5 font-['DM_Sans',sans-serif] text-base font-medium text-[var(--accent-primary)] transition-all duration-[var(--motion-duration)] ease-out hover:bg-[var(--glow)]"
            >
              Open related emotions
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
