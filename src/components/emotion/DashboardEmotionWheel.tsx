"use client";

import { useMemo } from "react";
import { applyEmotionTheme, EMOTION_THEMES, getTheme } from "@/src/lib/emotionTheme";

const WHEEL_KEYS = [
  "joy",
  "sadness",
  "anger",
  "fear",
  "surprise",
  "disgust",
  "neutral",
  "confusion",
] as const;

const CX = 150;
const CY = 150;
const R_OUTER = 118;
const R_INNER = 52;
const STEP = 360 / WHEEL_KEYS.length;

function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)] as const;
}

function wedgePath(start: number, end: number, outerR: number) {
  const largeArc = end - start > 180 ? 1 : 0;
  const [x0o, y0o] = polar(outerR, start);
  const [x1o, y1o] = polar(outerR, end);
  const [x0i, y0i] = polar(R_INNER, end);
  const [x1i, y1i] = polar(R_INNER, start);
  return [
    `M ${CX} ${CY}`,
    `L ${x0o} ${y0o}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x0i} ${y0i}`,
    `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${x1i} ${y1i}`,
    "Z",
  ].join(" ");
}

export type DashboardEmotionWheelProps = {
  selected: string | null;
  onSelect: (emotionKey: string) => void;
};

export default function DashboardEmotionWheel({
  selected,
  onSelect,
}: DashboardEmotionWheelProps) {
  const segments = useMemo(
    () =>
      WHEEL_KEYS.map((key, index) => ({
        key,
        theme: EMOTION_THEMES[key],
        start: index * STEP,
        end: (index + 1) * STEP,
      })),
    [],
  );

  const centerLabel = selected ? getTheme(selected).label : "Choose one";

  const handlePick = (key: string) => {
    onSelect(key);
    applyEmotionTheme(key);
  };

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg
        viewBox="0 0 300 300"
        className="h-auto w-full"
        role="application"
        aria-label="Emotion wheel. Choose how you feel right now."
      >
        {segments.map((seg) => {
          const active =
            selected?.toLowerCase() === seg.key ||
            selected?.toLowerCase() === seg.theme.dataAttr;
          const outerR = active ? R_OUTER + 12 : R_OUTER;

          return (
            <path
              key={seg.key}
              d={wedgePath(seg.start, seg.end, outerR)}
              fill={seg.theme.accentColor}
              opacity={active ? 1 : 0.82}
              className="cursor-pointer transition-[opacity,d] duration-300 ease-out"
              onClick={() => handlePick(seg.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePick(seg.key);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={seg.theme.label}
            />
          );
        })}

        <circle
          cx={CX}
          cy={CY}
          r={R_INNER - 6}
          fill="var(--emotion-surface, #161C26)"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="max-w-[5.5rem] text-center font-display text-sm font-bold leading-tight text-[var(--emotion-text,var(--text-primary))]">
          {centerLabel}
        </p>
      </div>
    </div>
  );
}
