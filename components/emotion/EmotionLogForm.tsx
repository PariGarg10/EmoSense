"use client";

import { useState } from "react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import FaceIllustration from "@/components/emotion/FaceIllustration";
import { useEmoSenseStore } from "@/lib/store";

const timeOptions = ["Morning", "Afternoon", "Evening", "Night"] as const;

const emotionPicker = [
  { name: "Joy", face: "joy" as const },
  { name: "Calm", face: "calm" as const },
  { name: "Sadness", face: "sadness" as const },
  { name: "Fear", face: "fear" as const },
  { name: "Anger", face: "anger" as const },
  { name: "Confused", face: "confused" as const },
];

const activities = [
  "School",
  "Home",
  "Social",
  "Mealtime",
  "Exercise",
  "Screen time",
  "Outdoors",
] as const;

function BatteryIcon({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 64 32" width="72" height="36" aria-hidden className="text-[var(--accent-primary)]">
      <rect x="4" y="6" width="50" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="56" y="12" width="4" height="8" rx="1" fill="currentColor" />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={8 + i * 9}
          y="10"
          width="6"
          height="12"
          rx="1"
          fill={i < level ? "currentColor" : "rgba(237,242,255,0.12)"}
        />
      ))}
    </svg>
  );
}

export default function EmotionLogForm() {
  const [timeOfDay, setTimeOfDay] = useState<(typeof timeOptions)[number]>("Morning");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");

  const addActivity = useEmoSenseStore((s) => s.addActivity);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const incrementStreak = useEmoSenseStore((s) => s.incrementStreak);

  function toggleActivity(activity: string) {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  }

  function handleSubmit() {
    if (!selectedEmotion) {
      addToast({ variant: "info", message: "Pick one emotion before saving." });
      return;
    }
    addActivity({
      emotion: selectedEmotion,
      note: [timeOfDay, ...selectedActivities, `Energy ${energy}/5`, note].filter(Boolean).join(" · "),
    });
    incrementStreak();
    addToast({ variant: "success", message: "Entry saved to your local activity list." });
    setNote("");
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-8">
      <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Log today</h2>

      <div className="mt-8">
        <p className="font-medium text-[var(--text-primary)]">Time of day</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {timeOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeOfDay(t)}
              className={clsx(
                "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--motion-duration)] ease-out",
                timeOfDay === t
                  ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                  : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[rgba(91,141,239,0.35)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-medium text-[var(--text-primary)]">Emotion</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Scroll sideways on small screens. Each card shows a face drawing plus a word.</p>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {emotionPicker.map((item) => {
            const active = selectedEmotion === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelectedEmotion(item.name)}
                className={clsx(
                  "min-w-[140px] shrink-0 rounded-2xl border p-4 text-left transition-transform duration-[var(--motion-duration)] ease-out hover:scale-[1.02]",
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--glow)]"
                    : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[rgba(91,141,239,0.35)]"
                )}
              >
                <div className="mx-auto h-20 w-20">
                  <FaceIllustration variant={item.face} title={`${item.name} face`} className="h-full w-full" />
                </div>
                <p className="mt-3 text-center font-display text-lg font-bold text-[var(--text-primary)]">{item.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-medium text-[var(--text-primary)]">Activity tags</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {activities.map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => toggleActivity(activity)}
              className={clsx(
                "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--motion-duration)] ease-out",
                selectedActivities.includes(activity)
                  ? "border-[var(--accent-primary)] bg-[var(--glow)] text-[var(--text-primary)]"
                  : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[rgba(91,141,239,0.35)]"
              )}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-medium text-[var(--text-primary)]">Energy level</p>
          <div className="flex items-center gap-3">
            <BatteryIcon level={energy} />
            <span className="font-mono-label text-sm text-[var(--text-secondary)]">{energy} / 5</span>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="mt-4 w-full accent-[var(--accent-primary)]"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={energy}
          aria-label="Energy level from 1 to 5"
        />
      </div>

      <div className="mt-8">
        <label htmlFor="behaviour-note" className="font-medium text-[var(--text-primary)]">
          Optional note
        </label>
        <textarea
          id="behaviour-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened? (optional)"
          className="mt-3 min-h-[140px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" onClick={handleSubmit}>
          Save entry
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.print()}
          className="min-h-[44px]"
        >
          Share with therapist (print)
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {selectedEmotion ? `Selected emotion ${selectedEmotion}` : "No emotion selected yet."}
      </p>
    </div>
  );
}
