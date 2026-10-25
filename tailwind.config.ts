import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        "emotion-bg": "var(--emotion-bg)",
        "emotion-surface": "var(--emotion-surface)",
        "emotion-accent": "var(--emotion-accent)",
        "emotion-text": "var(--emotion-text)",
        "emotion-face-bg": "var(--emotion-face-bg)",
        // Prefixed so names like `base` do not collide with `text-base` (font size).
        "es-base": "var(--bg-base)",
        "es-surface": "var(--bg-surface)",
        "es-elevated": "var(--bg-elevated)",
        "es-primary": "var(--accent-primary)",
        "es-warm": "var(--accent-warm)",
        "es-soft": "var(--accent-soft)",
        "es-alert": "var(--accent-alert)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
};

export default config;
