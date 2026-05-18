export type UserRole = "user" | "caregiver" | "therapist";

export type LogEntry = {
  logged_at: string;
  emotion: string;
  time_of_day?: string;
  activities?: string[];
  energy_level?: number;
  note?: string;
};

export type FontSizePreset = "sm" | "md" | "lg" | "xl";

export type ContrastPreset = "standard" | "high" | "low";

export type MotionPreset = "full" | "reduced" | "none";

export type ThemePreset = "dark" | "light" | "light-hc";

export type SensoryPreferences = {
  fontSize: FontSizePreset;
  contrast: ContrastPreset;
  motion: MotionPreset;
  theme: ThemePreset;
};

export type ActivityItem = {
  id: string;
  timestamp: string;
  emotion: string;
  note?: string;
};

export type FaceExpressions = Record<string, number>;
