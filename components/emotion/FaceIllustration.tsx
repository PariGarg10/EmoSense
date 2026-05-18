type FaceVariant =
  | "joy"
  | "sadness"
  | "anger"
  | "fear"
  | "surprise"
  | "disgust"
  | "calm"
  | "confused";

type FaceIllustrationProps = {
  variant: FaceVariant;
  className?: string;
  title?: string;
};

export default function FaceIllustration({
  variant,
  className = "",
  title,
}: FaceIllustrationProps) {
  const common = {
    viewBox: "0 0 120 120",
    role: "img" as const,
    "aria-hidden": !title,
    "aria-label": title,
    className,
  };

  const cap = title ? <title>{title}</title> : null;

  switch (variant) {
    case "joy":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <circle cx="42" cy="48" r="6" fill="var(--text-primary)" />
          <circle cx="78" cy="48" r="6" fill="var(--text-primary)" />
          <path
            d="M38 72c8 14 36 14 44 0"
            fill="none"
            stroke="var(--accent-warm)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "sadness":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <circle cx="42" cy="48" r="5" fill="var(--text-primary)" />
          <circle cx="78" cy="48" r="5" fill="var(--text-primary)" />
          <path
            d="M40 78c10-10 30-10 40 0"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "anger":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <path d="M34 40l14 8" stroke="var(--accent-alert)" strokeWidth="4" strokeLinecap="round" />
          <path d="M86 40l-14 8" stroke="var(--accent-alert)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="42" cy="52" r="5" fill="var(--text-primary)" />
          <circle cx="78" cy="52" r="5" fill="var(--text-primary)" />
          <path d="M42 78h36" stroke="var(--accent-alert)" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "fear":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <ellipse cx="42" cy="50" rx="7" ry="9" fill="var(--text-primary)" />
          <ellipse cx="78" cy="50" rx="7" ry="9" fill="var(--text-primary)" />
          <circle cx="60" cy="40" r="4" fill="var(--accent-primary)" />
          <path
            d="M46 78c4-8 24-8 28 0"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "surprise":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <circle cx="42" cy="48" r="7" fill="none" stroke="var(--text-primary)" strokeWidth="3" />
          <circle cx="78" cy="48" r="7" fill="none" stroke="var(--text-primary)" strokeWidth="3" />
          <ellipse cx="60" cy="76" rx="10" ry="12" fill="var(--accent-primary)" opacity="0.35" />
        </svg>
      );
    case "disgust":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <path d="M36 46h48" stroke="var(--accent-soft)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="40" cy="56" r="4" fill="var(--text-primary)" />
          <circle cx="80" cy="56" r="4" fill="var(--text-primary)" />
          <path
            d="M44 78c10-6 22-6 32 0"
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "calm":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <path d="M38 52h10M72 52h10" stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M44 74c10 6 22 6 32 0"
            fill="none"
            stroke="var(--accent-soft)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "confused":
      return (
        <svg {...common}>
          {cap}
          <circle cx="60" cy="60" r="52" fill="var(--bg-surface)" stroke="var(--border)" />
          <circle cx="42" cy="48" r="5" fill="var(--text-primary)" />
          <circle cx="78" cy="48" r="5" fill="var(--text-primary)" />
          <path
            d="M52 78c6-6 18 6 24 0"
            fill="none"
            stroke="var(--accent-warm)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M84 34c6 4 6 12 0 16"
            fill="none"
            stroke="var(--accent-warm)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export type { FaceVariant };
