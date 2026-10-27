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

const featureCards = [
  {
    title: "Read a face",
    body: "Camera or upload with on-device models and plain-language explanations.",
    href: "/emotion-scan",
  },
  {
    title: "Track moods",
    body: "Log energy, time of day, and activities to spot gentle patterns over time.",
    href: "/behaviour-tracker",
  },
  {
    title: "Emotion library",
    body: "Sixteen illustrated emotions with body maps and calming strategies.",
    href: "/emotion-dictionary",
  },
];

const primaryCta =
  "inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#EDF2FF] px-6 font-body text-base font-bold text-[#0D1117] shadow-[0_18px_60px_rgba(91,141,239,0.35)] transition-all duration-[var(--transition)] hover:-translate-y-0.5 hover:bg-white";

const ghostCta =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 font-body text-base font-bold text-[#EDF2FF] backdrop-blur-xl transition-all duration-[var(--transition)] hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/15";

const heroVideoSrc = "/hero-bg.mp4";

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
    <main className="isolate relative min-h-screen overflow-x-hidden bg-[#05070D] text-[var(--text-primary)] transition-colors duration-700">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {!reduceMotion && (
          <video
            className="h-full w-full scale-105 object-cover opacity-80 saturate-[1.2]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src={heroVideoSrc} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(91,141,239,0.24),transparent_34%),radial-gradient(circle_at_86%_72%,rgba(244,169,106,0.18),transparent_28%),linear-gradient(180deg,rgba(5,7,13,0.76),#05070D_86%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,13,0.88),rgba(5,7,13,0.54)_46%,rgba(5,7,13,0.9))]" />
      </div>

      <section className="relative z-10 flex min-h-screen flex-col overflow-hidden">

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
          <div
            className={clsx(
              "absolute -left-[10%] top-[-15%] h-[min(520px,80vw)] w-[min(520px,80vw)] rounded-full opacity-70",
              !reduceMotion && "emosense-mesh",
            )}
            style={{
              background:
                "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent-primary) 45%, transparent), transparent 65%)",
            }}
          />
          <div
            className={clsx(
              "absolute bottom-[-20%] right-[-15%] h-[min(560px,85vw)] w-[min(560px,85vw)] rounded-full opacity-70",
              !reduceMotion && "emosense-mesh emosense-mesh-delay-1",
            )}
            style={{
              background:
                "radial-gradient(circle at 70% 40%, color-mix(in srgb, var(--accent-warm) 35%, transparent), transparent 65%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 shadow-2xl backdrop-blur-2xl">
            <p className="font-display text-xl font-bold text-[#EDF2FF] drop-shadow">
              EmoSense
            </p>
            <nav className="hidden items-center gap-6 text-sm font-medium text-[#C5D0E0] md:flex">
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#emotions" className="hover:text-white">
                Emotions
              </a>
              <a href="#stories" className="hover:text-white">
                Stories
              </a>
            </nav>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-bold text-[#EDF2FF] backdrop-blur hover:border-white/40 hover:bg-white/15"
            >
              Sign in
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-10">
            <div className="max-w-3xl rounded-[36px] border border-white/10 bg-black/35 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-md md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#C5D0E0] backdrop-blur-2xl">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-soft)] shadow-[0_0_20px_var(--accent-soft)]" />
                Autism-friendly emotion support
              </div>

              <h1 className="mt-8 max-w-4xl font-display text-[clamp(3rem,7vw,6.8rem)] font-extrabold leading-[0.92] tracking-[-0.06em] text-[#EDF2FF] drop-shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                Understand every emotion.
              </h1>

              <p className="mt-7 max-w-2xl font-body text-[clamp(1.1rem,2vw,1.45rem)] leading-relaxed text-[#C5D0E0] drop-shadow">
                A calm space to read faces, track moods, and learn emotional
                language without pressure.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/login" className={primaryCta}>
                  Get started free
                </Link>
                <a href="#features" className={ghostCta}>
                  Watch how it feels
                </a>
              </div>

              <dl className="mt-12 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["16", "emotions"],
                  ["3", "care views"],
                  ["0", "pressure"],
                ].map(([value, label]) => (
                    <Link
                    key={label}
                      href={label === "emotions" ? "/emotion-dictionary" : label === "care views" ? "/reports" : "/login"}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl"
                  >
                    <dt className="font-display text-3xl font-bold text-white">
                      {value}
                    </dt>
                    <dd className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8A9BB5]">
                      {label}
                    </dd>
                  </Link>
                ))}
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-[560px]">
              <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(91,141,239,0.35),transparent_66%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-white/[0.08] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="rounded-[28px] border border-white/10 bg-[#0D1117]/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#8A9BB5]">
                        Live emotion preview
                      </p>
                      <p className="mt-2 font-display text-3xl font-bold text-white">
                        Calm, then clear
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/15 px-3 py-1 text-xs font-bold text-[#EDF2FF]">
                      gentle AI
                    </div>
                  </div>

                  <div className="mt-8 flex items-end justify-center gap-3 sm:gap-6">
                    <PhoneMockup
                      bg="#FFE566"
                      label="Happy"
                      mood="happy"
                      delayClass={reduceMotion ? undefined : "phone-float-delay-1"}
                      className="scale-90 opacity-90"
                    />
                    <PhoneMockup
                      bg="#5B8DEF"
                      label="Sad"
                      mood="sad"
                      className="z-10 -mt-8 scale-110"
                    />
                    <PhoneMockup
                      bg="#E07B7B"
                      label="Angry"
                      mood="angry"
                      delayClass={reduceMotion ? undefined : "phone-float-delay-2"}
                      className="scale-90 opacity-90"
                    />
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[
                      ["Read", "/emotion-scan"],
                      ["Track", "/behaviour-tracker"],
                      ["Learn", "/emotion-dictionary"],
                    ].map(([item, href]) => (
                      <Link
                        key={item}
                        href={href}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-4 text-center"
                      >
                        <p className="font-display text-lg font-bold text-white">
                          {item}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-primary)]">
            Designed around comfort
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#EDF2FF] md:text-5xl">
            Tools that feel quiet, not clinical.
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featureCards.map((card, idx) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[28px] border p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "rgba(22, 28, 38, 0.62)",
                borderColor: "rgba(255, 255, 255, 0.1)",
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
              <div
                className="mb-8 h-14 w-14 rounded-2xl"
                style={{
                  background: `linear-gradient(145deg, ${featureAccents[idx]}, rgba(255,255,255,0.15))`,
                  boxShadow: `0 0 40px ${featureAccents[idx]}40`,
                }}
              />
              <h3 className="font-display text-[24px] font-bold text-[#EDF2FF]">{card.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-[#C5D0E0]">{card.body}</p>
              <span className="mt-6 inline-flex text-sm font-bold text-[var(--accent-primary)]">
                Open {card.title} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="emotions" className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-warm)]">
              Interactive palette
            </p>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#EDF2FF] md:text-5xl">
              Let the whole page shift with a feeling.
            </h2>
          </div>
          <Link
            href="/emotion-dictionary"
            className="min-h-[44px] text-sm font-medium text-[var(--accent-primary)] underline-offset-4 hover:underline"
          >
            See all emotions →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {emotions.map((emo) => {
            const theme = EMOTION_THEMES[emo.themeKey] ?? EMOTION_THEMES.neutral;
            return (
              <button
                key={emo.id}
                type="button"
                onClick={() => applyEmotionTheme(emo.themeKey)}
                className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                style={{
                  background: `linear-gradient(145deg, ${theme.accentColor} 0%, ${theme.faceColor} 55%, ${theme.bgColor} 100%)`,
                }}
                aria-label={`Preview ${emo.name} theme`}
              >
                <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                <span className="relative z-10 px-2 text-center font-display text-sm font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-base">
                  {emo.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section id="stories" className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-[#EDF2FF] md:text-5xl">Voices from caregivers</h2>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((t) => (
            <Link
              key={t.role}
              href="/login"
              className="min-w-[280px] max-w-sm shrink-0 snap-start rounded-[28px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-2xl"
            >
              <blockquote className="text-sm leading-relaxed text-[var(--text-secondary)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs text-[var(--text-muted)]">{t.role}</figcaption>
            </Link>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 py-10 text-center text-sm text-[var(--text-muted)] backdrop-blur-xl">
        EmoSense — Built with care for autistic individuals
      </footer>
    </main>
  );
}
