"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, type FormEvent } from "react";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import { getTheme } from "@/src/lib/emotionTheme";

export type MoodCardProps = {
  emotion: string;
  timestamp: Date;
  onAddReason: (reason: string) => void;
  onDismiss: () => void;
  /** @default "overlay" */
  variant?: "overlay" | "inline";
};

function resolveThemeLookup(emotion: string): string {
  const k = emotion.trim().toLowerCase();
  if (k === "scared" || k === "scare") return "fear";
  return k;
}

function formatMoodTimestamp(d: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();
  let h = d.getHours();
  const minutes = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const minStr = minutes.toString().padStart(2, "0");
  return `${month}, ${day}  ${h}:${minStr} ${ampm}`;
}

function SendArrowIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export default function MoodCard({
  emotion,
  timestamp,
  onAddReason,
  onDismiss,
  variant = "overlay",
}: MoodCardProps) {
  const [reason, setReason] = useState("");
  const reduceMotion = useReducedMotion();
  const isOverlay = variant === "overlay";

  const theme = useMemo(
    () => getTheme(resolveThemeLookup(emotion)),
    [emotion],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = reason.trim();
    if (!t) return;
    onAddReason(t);
    setReason("");
  };

  return (
    <motion.div
      role={isOverlay ? "dialog" : "region"}
      aria-modal={isOverlay ? true : undefined}
      aria-labelledby="mood-card-label"
      data-emotion={theme.dataAttr}
      className={clsx(
        "flex flex-col text-emotion-text",
        isOverlay
          ? "fixed inset-0 z-50"
          : "relative w-full max-w-lg rounded-2xl border border-[var(--border)] shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
      )}
      style={{
        backgroundColor: "var(--emotion-bg)",
        color: "var(--emotion-text)",
        transition: "background-color 600ms ease-out, color 600ms ease-out",
      }}
      initial={
        reduceMotion || !isOverlay ? false : { y: 40, opacity: 0 }
      }
      animate={reduceMotion || !isOverlay ? false : { y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <header
        className={clsx(
          "relative flex shrink-0 justify-center px-4",
          isOverlay ? "pt-6" : "border-b border-[var(--border)]/40 py-4",
        )}
      >
        <p className="font-body text-[14px] leading-tight opacity-60">
          Current Mood
        </p>
        {isOverlay && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-6 flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[28px] font-light leading-none opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            style={{ color: "var(--emotion-text)" }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </header>

      <div
        className={clsx(
          "flex flex-col items-center px-6",
          isOverlay
            ? "min-h-0 flex-1 justify-center pb-8 pt-4"
            : "py-6",
        )}
      >
        <EmotionFace emotion={emotion} size="lg" animated className="shrink-0" />

        <h1
          id="mood-card-label"
          className="mt-8 text-center font-display text-[48px] font-bold leading-tight"
        >
          {theme.label}
        </h1>

        <p className="mt-3 font-body text-[16px] opacity-50">
          {formatMoodTimestamp(timestamp)}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={clsx(
          "shrink-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2",
          !isOverlay && "border-t border-[var(--border)]/40",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a reason"
            className="min-h-[44px] min-w-0 flex-1 rounded-full border-none bg-white/40 px-4 py-2 font-body text-[14px] text-emotion-text placeholder:text-emotion-text/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emotion-accent"
            aria-label="Add a reason"
          />
          <button
            type="submit"
            className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-full bg-emotion-accent text-white shadow-sm transition-transform active:scale-95"
            aria-label="Send reason"
          >
            <SendArrowIcon />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
