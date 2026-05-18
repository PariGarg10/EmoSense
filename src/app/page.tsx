"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { emotions } from "@/data/emotions";
import { applyEmotionTheme, EMOTION_THEMES } from "@/src/lib/emotionTheme";

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
  {
    quote:
      "The emotion colours help my son point to how he feels without finding the perfect word first.",
    role: "Father and primary caregiver",
  },
  {
    quote:
      "Reports give our team a shared language. We focus on patterns, not single bad days.",
    role: "School-based therapist",
  },
];

const featureAccents = ["#5B8DEF", "#7EC8A4", "#F4A96A"];

const primaryCta =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--accent-primary)] px-5 font-body text-base font-medium text-white transition-all duration-[var(--transition)] hover:brightness-110 hover:shadow-[var(--shadow-glow)]";

const ghostCta =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--accent-primary)] px-5 font-body text-base font-medium text-[var(--accent-primary)] transition-all duration-[var(--transition)] hover:bg-[var(--glow)]";

function PhoneMockup({
  bg,
  label,
  mood,
  className,
  delayClass,
}: {
  bg: string;
  label: string;
  mood: "happy" | "sad" | "angry";
  className?: string;
  delayClass?: string;
}) {
  const facePaths = {
    happy: (
      <>
        <circle cx="60" cy="58" r="6" fill="#2c3e50" />
        <circle cx="100" cy="58" r="6" fill="#2c3e50" />
        <path d="M52 88 Q80 108 108 88" fill="none" stroke="#2c3e50" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    sad: (
      <>
        <circle cx="60" cy="58" r="6" fill="#2c3e50" />
        <circle cx="100" cy="58" r="6" fill="#2c3e50" />
        <path d="M52 100 Q80 78 108 100" fill="none" stroke="#2c3e50" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    angry: (
      <>
        <path d="M48 52 L68 60" stroke="#2c3e50" strokeWidth="4" strokeLinecap="round" />
        <path d="M112 52 L92 60" stroke="#2c3e50" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="66" r="5" fill="#2c3e50" />
        <circle cx="100" cy="66" r="5" fill="#2c3e50" />
        <path d="M58 96 L102 96" fill="none" stroke="#2c3e50" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <div
      className={clsx(
        "phone-float flex flex-col items-center",
        delayClass,
        className,
      )}
    >
      <div
        className="relative w-[140px] overflow-hidden rounded-[28px] border-4 border-[#0a0e14] shadow-xl"
        style={{ background: bg }}
      >
        <div className="mx-auto mt-3 h-2 w-12 rounded-full bg-black/20" />
        <svg viewBox="0 0 160 160" className="w-full px-4 pb-6 pt-2" aria-hidden>
          <circle cx="80" cy="82" r="52" fill="rgba(255,255,255,0.35)" />
          {facePaths[mood]}
        </svg>
      </div>
      <span className="mt-3 font-display text-sm font-bold text-[#EDF2FF]">{label}</span>
    </div>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-700">
      <section className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={clsx(
              "absolute -left-[10%] top-[-15%] h-[min(520px,80vw)] w-[min(520px,80vw)] rounded-full opacity-90",
              !reduceMotion && "emosense-mesh",
            )}
            style={{
              background:
                "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent-primary) 45%, transparent), transparent 65%)",
            }}
          />
          <div
            className={clsx(
              "absolute bottom-[-20%] right-[-15%] h-[min(560px,85vw)] w-[min(560px,85vw)] rounded-full opacity-90",
              !reduceMotion && "emosense-mesh emosense-mesh-delay-1",
            )}
            style={{
              background:
                "radial-gradient(circle at 70% 40%, color-mix(in srgb, var(--accent-warm) 35%, transparent), transparent 65%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <p className="font-display text-xl font-bold text-[var(--accent-primary)]">EmoSense</p>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
            >
              Sign in
            </Link>
          </header>

          <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center lg:mt-8">
            <h1
              className="max-w-3xl font-display text-[52px] font-bold leading-tight text-[#EDF2FF] max-sm:text-[36px]"
            >
              Understand every emotion.
            </h1>
            <p className="mt-5 max-w-xl font-body text-[20px] text-[#8A9BB5]">
              Simple. Safe. At your own pace.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/login" className={primaryCta}>
                Get started free
              </Link>
              <a href="#features" className={ghostCta}>
                See how it works
              </a>
            </div>

            <div className="mt-16 flex items-end justify-center gap-4 sm:gap-8">
              <PhoneMockup
                bg="#FFE566"
                label="Happy"
                mood="happy"
                delayClass={reduceMotion ? undefined : "phone-float-delay-1"}
                className="scale-95 opacity-90"
              />
              <PhoneMockup
                bg="#5B8DEF"
                label="Sad"
                mood="sad"
                className="z-10 -mt-6 scale-110"
              />
              <PhoneMockup
                bg="#E07B7B"
                label="Angry"
                mood="angry"
                delayClass={reduceMotion ? undefined : "phone-float-delay-2"}
                className="scale-95 opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Built for clarity</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { title: "Read a face", body: "Camera or upload with on-device models and plain-language explanations." },
            { title: "Track moods", body: "Log energy, time of day, and activities to spot gentle patterns over time." },
            { title: "Emotion library", body: "Sixteen illustrated emotions with body maps and calming strategies." },
          ].map((card, idx) => (
            <article
              key={card.title}
              className="rounded-2xl border p-8 transition-all duration-300"
              style={{
                background: "#161C26",
                borderColor: "rgba(91, 141, 239, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = featureAccents[idx];
                e.currentTarget.style.boxShadow = `0 0 24px ${featureAccents[idx]}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(91, 141, 239, 0.15)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <h3 className="font-display text-[22px] font-bold text-[var(--text-primary)]">{card.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Feel the colours</h2>
          <Link
            href="/emotion-dictionary"
            className="min-h-[44px] text-sm font-medium text-[var(--accent-primary)] underline-offset-4 hover:underline"
          >
            See all emotions →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {emotions.map((emo) => {
            const theme = EMOTION_THEMES[emo.themeKey] ?? EMOTION_THEMES.neutral;
            return (
              <button
                key={emo.id}
                type="button"
                onClick={() => applyEmotionTheme(emo.themeKey)}
                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 transition-transform duration-300 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                style={{
                  background: `linear-gradient(145deg, ${theme.accentColor} 0%, ${theme.faceColor} 55%, ${theme.bgColor} 100%)`,
                }}
                aria-label={`Preview ${emo.name} theme`}
              >
                <span className="relative z-10 px-2 text-center font-display text-sm font-bold text-white drop-shadow-md sm:text-base">
                  {emo.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Voices from caregivers</h2>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t) => (
            <figure
              key={t.role}
              className="min-w-[260px] max-w-sm shrink-0 snap-start rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6"
            >
              <blockquote className="text-sm leading-relaxed text-[var(--text-secondary)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs text-[var(--text-muted)]">{t.role}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--border)] py-10 text-center text-sm text-[var(--text-muted)]">
        EmoSense — Built with care for autistic individuals
      </footer>
    </main>
  );
}
