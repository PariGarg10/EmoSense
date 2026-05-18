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
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        primary: "var(--accent-primary)",
        warm: "var(--accent-warm)",
        soft: "var(--accent-soft)",
        alert: "var(--accent-alert)",
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
