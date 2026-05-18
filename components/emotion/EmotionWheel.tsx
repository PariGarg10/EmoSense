"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEmoSenseStore } from "@/lib/store";
import Button from "@/components/ui/Button";

const cx = 110;
const cy = 110;
const rOuter = 105;
const rInner = 44;

const segments = [
  { label: "Joy", color: "#F4A96A", angle: 0, labelFill: "#0D1117" },
  { label: "Sadness", color: "#5B8DEF", angle: 45, labelFill: "#EDF2FF" },
  { label: "Anger", color: "#E07B7B", angle: 90, labelFill: "#0D1117" },
  { label: "Fear", color: "#6FA8DC", angle: 135, labelFill: "#0D1117" },
  { label: "Surprise", color: "#8EC5FF", angle: 180, labelFill: "#0D1117" },
  { label: "Disgust", color: "#8FBC8F", angle: 225, labelFill: "#0D1117" },
  { label: "Calm", color: "#7EC8A4", angle: 270, labelFill: "#0D1117" },
  { label: "Confused", color: "#F4A96A", angle: 315, labelFill: "#0D1117" },
] as const;

function polar(x: number, y: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [x + r * Math.cos(rad), y + r * Math.sin(rad)] as const;
}

function wedgePath(start: number, end: number) {
  const largeArc = end - start > 180 ? 1 : 0;
  const [x0o, y0o] = polar(cx, cy, rOuter, start);
  const [x1o, y1o] = polar(cx, cy, rOuter, end);
  const [x0i, y0i] = polar(cx, cy, rInner, end);
  const [x1i, y1i] = polar(cx, cy, rInner, start);
  return [
    `M ${cx} ${cy}`,
    `L ${x0o} ${y0o}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x0i} ${y0i}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1i} ${y1i}`,
    "Z",
  ].join(" ");
}

export default function EmotionWheel() {
  const reduceMotion = useReducedMotion();
  const selected = useEmoSenseStore((s) => s.currentEmotion);
  const setEmotion = useEmoSenseStore((s) => s.setEmotion);
  const checkInSubmitted = useEmoSenseStore((s) => s.checkInSubmitted);
  const setCheckInSubmitted = useEmoSenseStore((s) => s.setCheckInSubmitted);
  const addActivity = useEmoSenseStore((s) => s.addActivity);
  const addToast = useEmoSenseStore((s) => s.addToast);

  const step = 360 / segments.length;

  function handleSubmit() {
    if (!selected) return;
    addActivity({ emotion: selected });
    setCheckInSubmitted(true);
    addToast({
      variant: "success",
      message: "Your check-in was saved. Thank you for pausing to notice how you feel.",
    });
  }

  return (
    <div className="flex w-full max-w-[min(100%,420px)] flex-col items-center gap-8">
      <div className="relative w-full max-w-[360px]">
        <svg
          viewBox="0 0 220 220"
          className="h-auto w-full drop-shadow-[0_12px_40px_var(--glow)]"
          role="application"
          aria-label="Emotion wheel. Choose one feeling that fits best right now."
        >
          <defs>
            <filter id="wheelGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {segments.map((seg, index) => {
            const start = seg.angle;
            const end = seg.angle + step;
            const mid = start + step / 2;
            const [lx, ly] = polar(cx, cy, (rOuter + rInner) / 2 + 8, mid);
            const active = selected === seg.label;
            const d = wedgePath(start, end);

            return (
              <g key={seg.label}>
                <path
                  d={d}
                  fill={seg.color}
                  opacity={active ? 1 : 0.78}
                  stroke={active ? "var(--text-primary)" : "rgba(13,17,23,0.35)"}
                  strokeWidth={active ? 3 : 1}
                  className="cursor-pointer transition-[opacity,stroke-width] duration-[var(--motion-duration)] ease-out"
                  filter={active ? "url(#wheelGlow)" : undefined}
                  onClick={() => {
                    setEmotion(seg.label);
                    setCheckInSubmitted(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEmotion(seg.label);
                      setCheckInSubmitted(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${seg.label}. Segment ${index + 1} of ${segments.length}.`}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={seg.labelFill}
                  className="pointer-events-none select-none font-display text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    fontSize: 11,
                    paintOrder: "stroke fill",
                    stroke: "rgba(13,17,23,0.18)",
                    strokeWidth: 2,
                  }}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          <circle
            cx={cx}
            cy={cy}
            r={rInner - 4}
            fill="var(--bg-elevated)"
            stroke="var(--border)"
            strokeWidth={1.5}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="max-w-[7.5rem] text-center">
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Selected
            </p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--text-primary)]">
              {selected || "Tap a segment"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Button
          type="button"
          disabled={!selected}
          onClick={handleSubmit}
          className="w-full min-h-[44px] sm:w-auto"
        >
          {selected ? `Save ${selected} check-in` : "Pick a feeling to save"}
        </Button>

        <div
          className="min-h-[3rem] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-center text-sm text-[var(--text-secondary)]"
          aria-live="polite"
        >
          {checkInSubmitted && selected ? (
            <span>
              Saved: <strong className="text-[var(--text-primary)]">{selected}</strong>.
              You can change your mind any time—feelings move like weather.
            </span>
          ) : (
            <span>
              The wheel uses color and words so nothing relies on color alone.
            </span>
          )}
        </div>
      </div>

      {!reduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none h-1 w-32 rounded-full bg-[var(--border)]"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
