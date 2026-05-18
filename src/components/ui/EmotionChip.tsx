import clsx from "clsx";
import { getTheme } from "@/src/lib/emotionTheme";

export type EmotionChipSize = "sm" | "md" | "lg";

export type EmotionChipProps = {
  emotion: string;
  size?: EmotionChipSize;
  className?: string;
};

const sizeClasses: Record<EmotionChipSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-2 text-base",
};

export default function EmotionChip({
  emotion,
  size = "md",
  className,
}: EmotionChipProps) {
  const theme = getTheme(emotion.trim());
  const accent = theme.accentColor;

  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center rounded-full border font-medium font-body",
        sizeClasses[size],
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${accent} 13%, transparent)`,
        borderColor: `color-mix(in srgb, ${accent} 33%, transparent)`,
        color: accent,
      }}
    >
      <span className="truncate">{theme.label}</span>
    </span>
  );
}
