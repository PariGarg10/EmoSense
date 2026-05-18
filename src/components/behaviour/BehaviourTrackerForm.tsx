"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import { applyEmotionTheme, getTheme } from "@/src/lib/emotionTheme";
import { insertBehaviourLog } from "@/src/lib/behaviourLogs";
import { useEmoSenseStore } from "@/lib/store";

const timeOptions = ["Morning", "Afternoon", "Evening", "Night"] as const;
const activities = [
  "School",
  "Home",
  "Social",
  "Mealtime",
  "Exercise",
  "Screen time",
  "Outdoors",
] as const;

const emotionOptions = [
  { key: "joy", label: "Joy" },
  { key: "calm", label: "Calm" },
  { key: "sadness", label: "Sad" },
  { key: "fear", label: "Fear" },
  { key: "anger", label: "Anger" },
  { key: "confusion", label: "Confused" },
] as const;

function EnergyBattery({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 64 32" width={80} height={40} aria-hidden>
      <rect
        x={4}
        y={6}
        width={50}
        height={20}
        rx={4}
        fill="none"
        stroke="var(--emotion-accent, #5B8DEF)"
        strokeWidth={2}
      />
      <rect
        x={56}
        y={12}
        width={4}
        height={8}
        rx={1}
        fill="var(--emotion-accent, #5B8DEF)"
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={8 + i * 9}
          y={10}
          width={6}
          height={12}
          rx={1}
          fill={
            i < level
              ? "var(--emotion-accent, #5B8DEF)"
              : "color-mix(in srgb, var(--emotion-accent, #5B8DEF) 20%, transparent)"
          }
        />
      ))}
    </svg>
  );
}

export default function BehaviourTrackerForm() {
  const user = useEmoSenseStore((s) => s.user);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const incrementStreak = useEmoSenseStore((s) => s.incrementStreak);
  const addActivity = useEmoSenseStore((s) => s.addActivity);

  const [timeOfDay, setTimeOfDay] =
    useState<(typeof timeOptions)[number]>("Morning");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedEmotion) return;
    applyEmotionTheme(selectedEmotion);
  }, [selectedEmotion]);

  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [note]);

  function toggleActivity(activity: string) {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity],
    );
  }

  async function handleSave() {
    if (!selectedEmotion) {
      addToast({ variant: "info", message: "Pick one emotion before saving." });
      return;
    }
    setSaving(true);
    const label = getTheme(selectedEmotion).label;

    if (user?.id) {
      await insertBehaviourLog({
        userId: user.id,
        timeOfDay,
        emotion: selectedEmotion,
        activities: selectedActivities,
        energyLevel,
        note: note.trim() || undefined,
      });
    }

    addActivity({
      emotion: label,
      note: [timeOfDay, ...selectedActivities, `Energy ${energyLevel}/5`, note]
        .filter(Boolean)
        .join(" · "),
    });
    incrementStreak();
    addToast({ variant: "success", message: "Behaviour log saved." });
    setNote("");
    setSaving(false);
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
        Log today
      </h2>

      <div className="mt-8">
        <p className="font-body text-sm font-medium text-[var(--text-secondary)]">
          Time of day
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {timeOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeOfDay(t)}
              className={clsx(
                "min-h-[44px] rounded-lg px-4 text-sm font-medium transition-colors duration-300",
                timeOfDay === t
                  ? "bg-[var(--emotion-accent,#5B8DEF)] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-body text-sm font-medium text-[var(--text-secondary)]">
          Emotion
        </p>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {emotionOptions.map((item) => {
            const active = selectedEmotion === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedEmotion(item.key)}
                className={clsx(
                  "flex min-w-[100px] shrink-0 flex-col items-center gap-2 rounded-xl p-3 transition-[box-shadow,transform] duration-300",
                  active
                    ? "ring-2 ring-[var(--emotion-accent,#5B8DEF)]"
                    : "ring-1 ring-transparent",
                )}
              >
                <EmotionFace emotion={item.key} size="sm" animated={false} />
                <span className="font-body text-sm font-medium text-[var(--emotion-text,var(--text-primary))]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-body text-sm font-medium text-[var(--text-secondary)]">
          Activities
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {activities.map((activity) => {
            const on = selectedActivities.includes(activity);
            return (
              <button
                key={activity}
                type="button"
                onClick={() => toggleActivity(activity)}
                className={clsx(
                  "min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors duration-300",
                  on
                    ? "bg-[var(--emotion-accent,#5B8DEF)] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                )}
              >
                {activity}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-body text-sm font-medium text-[var(--text-secondary)]">
            Energy level
          </p>
          <EnergyBattery level={energyLevel} />
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={energyLevel}
          onChange={(e) => setEnergyLevel(Number(e.target.value))}
          className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{
            accentColor: "var(--emotion-accent, #5B8DEF)",
            background: `linear-gradient(to right, var(--emotion-accent, #5B8DEF) 0%, var(--emotion-accent, #5B8DEF) ${((energyLevel - 1) / 4) * 100}%, var(--bg-elevated) ${((energyLevel - 1) / 4) * 100}%, var(--bg-elevated) 100%)`,
          }}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={energyLevel}
          aria-label="Energy level from 1 to 5"
        />
      </div>

      <div className="mt-8">
        <label
          htmlFor="behaviour-note"
          className="font-body text-sm font-medium text-[var(--text-secondary)]"
        >
          Note
        </label>
        <textarea
          ref={noteRef}
          id="behaviour-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened? (optional)"
          className="mt-3 min-h-[120px] w-full resize-none overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--emotion-surface,#161C26)] p-4 font-body text-[var(--emotion-text,var(--text-primary))] placeholder:text-[var(--text-muted)] transition-[background-color] duration-[600ms] ease-out"
        />
      </div>

      <Button
        type="button"
        onClick={() => void handleSave()}
        loading={saving}
        className="mt-8 w-full md:w-auto"
      >
        Save entry
      </Button>
    </Card>
  );
}
