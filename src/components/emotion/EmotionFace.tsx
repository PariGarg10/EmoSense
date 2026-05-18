"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

const STROKE = "#2C3E50";
const STROKE_WIDTH = 6;

const SIZE_PX: Record<EmotionFaceSize, number> = {
  sm: 60,
  md: 100,
  lg: 180,
};

export type EmotionFaceSize = "sm" | "md" | "lg";

export type EmotionFaceProps = {
  emotion: string;
  size?: EmotionFaceSize;
  /** @default true */
  animated?: boolean;
  className?: string;
  "aria-label"?: string;
};

type FaceKey =
  | "joy"
  | "sadness"
  | "anger"
  | "fear"
  | "surprise"
  | "disgust"
  | "calm"
  | "confused";

function normalizeEmotion(emotion: string): FaceKey {
  const k = emotion.trim().toLowerCase();
  if (k === "joy" || k === "happy") return "joy";
  if (k === "sadness" || k === "sad") return "sadness";
  if (k === "anger" || k === "angry") return "anger";
  if (k === "fear" || k === "scared" || k === "scare") return "fear";
  if (k === "surprise" || k === "surprised") return "surprise";
  if (k === "disgust") return "disgust";
  if (k === "calm" || k === "neutral") return "calm";
  if (k === "confused" || k === "confusion") return "confused";
  return "calm";
}

const pathStroke = {
  stroke: STROKE,
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none" as const,
};

function FaceSvg({ face }: { face: FaceKey }) {
  const commonSvg = {
    viewBox: "0 0 100 100",
    xmlns: "http://www.w3.org/2000/svg" as const,
    className: "block h-[82%] w-[82%] max-h-full max-w-full shrink-0",
    "aria-hidden": true as const,
  };

  switch (face) {
    case "joy":
      return (
        <svg {...commonSvg}>
          <circle cx={35} cy={38} r={4} fill={STROKE} />
          <circle cx={65} cy={38} r={4} fill={STROKE} />
          <path d="M28,58 Q50,78 72,58" {...pathStroke} />
        </svg>
      );
    case "sadness":
      return (
        <svg {...commonSvg}>
          <circle cx={35} cy={40} r={4} fill={STROKE} />
          <circle cx={65} cy={40} r={4} fill={STROKE} />
          <path d="M28,68 Q50,52 72,68" {...pathStroke} />
        </svg>
      );
    case "anger":
      return (
        <svg {...commonSvg}>
          <path d="M22,28 L42,36" {...pathStroke} />
          <path d="M78,28 L58,36" {...pathStroke} />
          <circle cx={35} cy={44} r={4} fill={STROKE} />
          <circle cx={65} cy={44} r={4} fill={STROKE} />
          <path d="M32,65 Q50,58 68,65" {...pathStroke} />
        </svg>
      );
    case "fear":
      return (
        <svg {...commonSvg}>
          <path d="M25,30 L42,36" {...pathStroke} />
          <path d="M75,30 L58,36" {...pathStroke} />
          <circle cx={35} cy={44} r={5} fill={STROKE} />
          <circle cx={65} cy={44} r={5} fill={STROKE} />
          <ellipse cx={50} cy={65} rx={10} ry={7} fill={STROKE} />
        </svg>
      );
    case "surprise":
      return (
        <svg {...commonSvg}>
          <path d="M25,26 L42,32" {...pathStroke} />
          <path d="M75,26 L58,32" {...pathStroke} />
          <circle cx={35} cy={44} r={6} fill={STROKE} />
          <circle cx={65} cy={44} r={6} fill={STROKE} />
          <ellipse cx={50} cy={67} rx={9} ry={12} fill={STROKE} />
        </svg>
      );
    case "disgust":
      return (
        <svg {...commonSvg}>
          <path d="M25,32 L42,36" {...pathStroke} />
          <circle cx={35} cy={42} r={4} fill={STROKE} />
          <path d="M58,40 Q65,36 72,40" {...pathStroke} />
          <path d="M30,62 Q40,56 50,60 Q60,64 70,58" {...pathStroke} />
        </svg>
      );
    case "calm":
      return (
        <svg {...commonSvg}>
          <path d="M28,40 Q35,35 42,40" {...pathStroke} />
          <path d="M58,40 Q65,35 72,40" {...pathStroke} />
          <path d="M36,60 Q50,68 64,60" {...pathStroke} />
        </svg>
      );
    case "confused":
      return (
        <svg {...commonSvg}>
          <path d="M22,28 L40,34" {...pathStroke} />
          <path d="M60,34 L78,32" {...pathStroke} />
          <circle cx={35} cy={44} r={4} fill={STROKE} />
          <circle cx={65} cy={44} r={4} fill={STROKE} />
          <path d="M32,62 Q42,58 50,62 Q58,66 68,62" {...pathStroke} />
        </svg>
      );
    default:
      return null;
  }
}

export default function EmotionFace({
  emotion,
  size = "md",
  animated = true,
  className = "",
  "aria-label": ariaLabel,
}: EmotionFaceProps) {
  const face = normalizeEmotion(emotion);
  const px = SIZE_PX[size];

  const containerStyle: CSSProperties = {
    width: px,
    height: px,
    backgroundColor: "var(--emotion-face-bg)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 600ms ease-out",
  };

  const label = ariaLabel ?? `${emotion} face`;

  return (
    <motion.div
      className={className}
      style={containerStyle}
      role="img"
      aria-label={label}
      initial={animated ? { scale: 0.8 } : false}
      animate={animated ? { scale: 1 } : false}
      transition={
        animated
          ? { type: "spring", visualDuration: 0.4, bounce: 0.28 }
          : undefined
      }
      whileHover={animated ? { scale: 1.05 } : undefined}
    >
      <FaceSvg face={face} />
    </motion.div>
  );
}
