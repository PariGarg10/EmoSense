"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

const testimonials = [
  {
    quote:
      "Having words and pictures together helps us debrief after school without pressure. The charts feel calm, not like grades.",
    role: "Parent of autistic child, age 9",
  },
  {
    quote:
      "We use the dictionary before appointments so we can name body feelings without guessing. The layout stays readable at high zoom.",
    role: "Caregiver and occupational therapist",
  },
  {
    quote:
      "My client asked for fewer surprises. The behaviour log makes patterns visible without blaming anyone.",
    role: "Clinical psychologist",
  },
];

function FeatureIconScan() {
  return (
    <svg viewBox="0 0 96 96" className="h-16 w-16 text-[var(--accent-primary)]" aria-hidden>
      <rect x="12" y="18" width="72" height="54" rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="48" cy="45" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M30 72h36" stroke="var(--accent-warm)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function FeatureIconTracker() {
  return (
    <svg viewBox="0 0 96 96" className="h-16 w-16 text-[var(--accent-soft)]" aria-hidden>
      <path d="M16 70 L32 48 L46 58 L62 34 L80 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="48" r="4" fill="currentColor" />
      <circle cx="62" cy="34" r="4" fill="currentColor" />
    </svg>
  );
}

function FeatureIconBook() {
  return (
    <svg viewBox="0 0 96 96" className="h-16 w-16 text-[var(--accent-warm)]" aria-hidden>
      <path d="M24 20h24c8 0 12 4 12 12v52H24V20z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M48 20h24v64H48c0-8-4-12-12-12" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

const primaryCta =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent-primary)] px-5 font-['DM_Sans',sans-serif] text-base font-medium text-white shadow-none transition-all duration-[var(--motion-duration)] ease-out hover:brightness-110 hover:shadow-[var(--shadow-glow)]";

const ghostCta =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--accent-primary)] px-5 font-['DM_Sans',sans-serif] text-base font-medium text-[var(--accent-primary)] transition-all duration-[var(--motion-duration)] ease-out hover:bg-[var(--glow)]";

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="emosense-mesh absolute -left-1/4 top-[-20%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(91,141,239,0.35),transparent_60%)] blur-3xl" />
        <div className="emosense-mesh absolute bottom-[-25%] right-[-20%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_70%_40%,rgba(244,169,106,0.22),transparent_60%)] blur-3xl" />
        <div className="emosense-mesh absolute left-[35%] top-[40%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(126,200,164,0.18),transparent_65%)] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-xl font-extrabold">EmoSense</p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-[var(--motion-duration)] ease-out hover:border-[rgba(91,141,239,0.45)] hover:text-[var(--text-primary)]"
          >
            Go to app
          </Link>
        </header>

        <section className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="font-display text-[56px] font-extrabold leading-tight text-[var(--text-primary)] max-[480px]:text-[40px]"
            >
              Understand every emotion. At your own pace.
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: reduceMotion ? 0 : 0.08 }}
              className="mt-6 max-w-[540px] font-['DM_Sans',sans-serif] text-[20px] leading-relaxed text-[var(--text-secondary)]"
            >
              Facial cues, behaviour patterns, and a gentle dictionary—built for autistic people, caregivers, and therapists.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: reduceMotion ? 0 : 0.16 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href="/dashboard" className={primaryCta}>
                Start free
              </Link>
              <a href="#features" className={ghostCta}>
                See how it works
              </a>
            </motion.div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-square rounded-[32px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-glow)]">
              <svg viewBox="0 0 320 320" className="h-full w-full" role="img" aria-label="Face silhouette with emotion labels">
                <defs>
                  <linearGradient id="faceSilhouette" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5B8DEF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7EC8A4" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
                <circle cx="160" cy="160" r="150" fill="url(#faceSilhouette)" opacity="0.35" />
                <path
                  d="M160 86c-44 0-80 36-80 80s36 80 80 80 80-36 80-80-36-80-80-80zm-30 52a10 10 0 1 1 20 0 10 10 0 0 1-20 0zm60 0a10 10 0 1 1 20 0 10 10 0 0 1-20 0zm-46 58c14 18 48 18 62 0"
                  fill="none"
                  stroke="var(--text-primary)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {[
                  { label: "Calm", x: 44, y: 120 },
                  { label: "Joy", x: 232, y: 112 },
                  { label: "Focus", x: 70, y: 232 },
                  { label: "Curious", x: 214, y: 224 },
                ].map((tag) => (
                  <text
                    key={tag.label}
                    x={tag.x}
                    y={tag.y}
                    className={clsx(
                      "fill-[var(--text-secondary)] font-display text-[11px] font-bold uppercase tracking-[0.2em]",
                      !reduceMotion && "emosense-pulse"
                    )}
                  >
                    {tag.label}
                  </text>
                ))}
              </svg>
            </div>
            <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
              Illustration is original SVG—no stock photography.
            </p>
          </div>
        </section>

        <section id="features" className="mt-24">
          <h2 className="font-display text-3xl font-bold">Built for clarity</h2>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            Three pillars work together: scan, track, and learn—each with icons and text so nothing is color-only.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Emotion Scan",
                body: "Camera or upload, on-device models, and a short AI explanation in plain words.",
                icon: <FeatureIconScan />,
              },
              {
                title: "Behaviour Tracker",
                body: "Time-of-day context, energy, and weekly grids that show patterns without judgment.",
                icon: <FeatureIconTracker />,
              },
              {
                title: "Emotion Dictionary",
                body: "Illustrated faces, body maps, and strategies you can open in a quiet moment.",
                icon: <FeatureIconBook />,
              },
            ].map((card, idx) => (
              <motion.article
                key={card.title}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: reduceMotion ? 0 : idx * 0.08 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 transition-transform duration-[var(--motion-duration)] ease-out hover:-translate-y-0.5 hover:border-[rgba(91,141,239,0.4)] hover:shadow-[var(--shadow-glow)]"
              >
                {card.icon}
                <h3 className="mt-6 font-display text-[22px] font-bold">{card.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">{card.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="font-display text-3xl font-bold">Voices from caregivers</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">No names or photos—privacy first.</p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {testimonials.map((t) => (
              <figure
                key={t.role}
                className="min-w-[260px] max-w-sm snap-start rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6"
              >
                <blockquote className="text-sm leading-relaxed text-[var(--text-secondary)]">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-xs font-mono-label text-[var(--text-muted)]">{t.role}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
