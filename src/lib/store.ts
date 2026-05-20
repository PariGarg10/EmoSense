"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyEmotionTheme,
  clearEmotionTheme,
} from "@/src/lib/emotionTheme";
import type {
  ActivityItem,
  FontSizePreset,
  SensoryPreferences,
  UserRole,
} from "@/lib/types";

export type User = {
  id: string;
  displayName?: string;
  email?: string;
};

export type Toast = {
  id: string;
  variant: "success" | "error" | "info";
  message: string;
};

type EmoSenseStore = {
  user: User | null;
  setUser: (user: User | null) => void;

  currentEmotion: string | null;
  setCurrentEmotion: (emotion: string | null) => void;
  /** @deprecated Prefer setCurrentEmotion; kept for existing call sites */
  setEmotion: (emotion: string) => void;

  checkInSubmitted: boolean;
  setCheckInSubmitted: (value: boolean) => void;

  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  sensory: SensoryPreferences;
  setSensory: (partial: Partial<SensoryPreferences>) => void;

  dailyReminderEnabled: boolean;
  setDailyReminderEnabled: (v: boolean) => void;
  dailyReminderTime: string;
  setDailyReminderTime: (t: string) => void;
  weeklyReportEmail: boolean;
  setWeeklyReportEmail: (v: boolean) => void;

  behaviourStreak: number;
  incrementStreak: () => void;
  lastStreakDate: string | null;
  dailyEmotions: { date: string; emotion: string; source: "manual" | "scan" | "tracker" }[];
  recordDailyEmotion: (emotion: string, source: "manual" | "scan" | "tracker") => void;

  weekEmotionSeries: { day: string; count: number }[];
  lastScan: { emotion: string; confidence: number } | null;
  setLastScan: (scan: { emotion: string; confidence: number } | null) => void;

  recentActivity: ActivityItem[];
  addActivity: (item: Omit<ActivityItem, "id" | "timestamp">) => void;

  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

function applySensoryToDocument(s: SensoryPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.font = s.fontSize;
  root.dataset.contrast = s.contrast;
  root.dataset.motion = s.motion;
  root.dataset.theme = s.theme;

  const fontMap: Record<FontSizePreset, string> = {
    sm: "0.875",
    md: "1",
    lg: "1.125",
    xl: "1.25",
  };
  root.style.setProperty("--font-scale", fontMap[s.fontSize]);
}

export const useEmoSenseStore = create<EmoSenseStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),

      currentEmotion: null,
      setCurrentEmotion: (emotion) => {
        set({ currentEmotion: emotion });
        if (typeof document === "undefined") return;
        const trimmed = emotion?.trim() ?? "";
        if (!trimmed) {
          clearEmotionTheme();
          return;
        }
        applyEmotionTheme(trimmed);
      },
      setEmotion: (emotion) => {
        get().setCurrentEmotion(emotion.trim() ? emotion : null);
      },

      checkInSubmitted: false,
      setCheckInSubmitted: (value) => set({ checkInSubmitted: value }),

      userRole: "user",
      setUserRole: (role) => set({ userRole: role }),

      sensory: {
        fontSize: "md",
        contrast: "standard",
        motion: "full",
        theme: "dark",
      },
      setSensory: (partial) => {
        const next = { ...get().sensory, ...partial };
        set({ sensory: next });
        applySensoryToDocument(next);
      },

      dailyReminderEnabled: false,
      setDailyReminderEnabled: (v) => set({ dailyReminderEnabled: v }),
      dailyReminderTime: "09:00",
      setDailyReminderTime: (t) => set({ dailyReminderTime: t }),
      weeklyReportEmail: false,
      setWeeklyReportEmail: (v) => set({ weeklyReportEmail: v }),

      behaviourStreak: 0,
      lastStreakDate: null,
      dailyEmotions: [],
      incrementStreak: () => {
        const today = new Date().toISOString().slice(0, 10);
        const last = get().lastStreakDate;
        if (last === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);

        set({
          behaviourStreak: last === yesterdayKey ? get().behaviourStreak + 1 : 1,
          lastStreakDate: today,
        });
      },
      recordDailyEmotion: (emotion, source) => {
        const today = new Date().toISOString().slice(0, 10);
        const next = [
          { date: today, emotion, source },
          ...get().dailyEmotions.filter((entry) => entry.date !== today),
        ].slice(0, 60);
        set({ dailyEmotions: next });
        get().incrementStreak();
      },

      weekEmotionSeries: [
        { day: "Mon", count: 3 },
        { day: "Tue", count: 5 },
        { day: "Wed", count: 2 },
        { day: "Thu", count: 4 },
        { day: "Fri", count: 6 },
        { day: "Sat", count: 3 },
        { day: "Sun", count: 4 },
      ],
      lastScan: { emotion: "Calm", confidence: 82 },
      setLastScan: (scan) => set({ lastScan: scan }),

      recentActivity: [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          emotion: "Calm",
          note: "Quiet reading before bed",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          emotion: "Joy",
        },
      ],
      addActivity: (item) =>
        set({
          recentActivity: [
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              ...item,
            },
            ...get().recentActivity,
          ].slice(0, 50),
        }),

      toasts: [],
      addToast: (toast) => {
        const id = crypto.randomUUID();
        set({ toasts: [...get().toasts, { ...toast, id }] });
        window.setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) =>
        set({
          toasts: get().toasts.filter((t) => t.id !== id),
        }),
    }),
    {
      name: "emosense-store",
      partialize: (s) => ({
        user: s.user,
        sensory: s.sensory,
        userRole: s.userRole,
        dailyReminderEnabled: s.dailyReminderEnabled,
        dailyReminderTime: s.dailyReminderTime,
        weeklyReportEmail: s.weeklyReportEmail,
        behaviourStreak: s.behaviourStreak,
        lastStreakDate: s.lastStreakDate,
        dailyEmotions: s.dailyEmotions,
        lastScan: s.lastScan,
        recentActivity: s.recentActivity,
        weekEmotionSeries: s.weekEmotionSeries,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.sensory) applySensoryToDocument(state.sensory);
      },
    },
  ),
);

export const useEmotionStore = useEmoSenseStore;
