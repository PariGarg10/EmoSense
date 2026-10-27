"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import BehaviourTrackerForm from "@/src/components/behaviour/BehaviourTrackerForm";
import BehaviourInsightsCard from "@/src/components/emotion/BehaviourInsightsCard";
import { useUserLogs } from "@/src/hooks/useUserLogs";
import type { LogEntry } from "@/lib/types";

const WeeklyBehaviourHeatmap = dynamic(
  () => import("@/src/components/charts/WeeklyBehaviourHeatmap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-xl bg-[var(--emotion-surface,#161C26)]" />
    ),
  },
);

export default function BehaviourTrackerPage() {
  const { emotionLogs, behaviourLogs, loading } = useUserLogs();

  const heatmapEntries = useMemo(
    () => [...behaviourLogs, ...emotionLogs],
    [behaviourLogs, emotionLogs],
  );

  const weekLogs = useMemo<LogEntry[]>(() => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 6);
    const iso = since.toISOString();
    return [
      ...behaviourLogs
        .filter((l) => l.logged_at >= iso)
        .map((l) => ({
          logged_at: l.logged_at,
          emotion: l.emotion,
          time_of_day: l.time_of_day ?? undefined,
          activities: l.activities ?? [],
          energy_level: l.energy_level ?? undefined,
          note: l.note ?? undefined,
        })),
      ...emotionLogs
        .filter((l) => l.logged_at >= iso)
        .map((l) => ({
          logged_at: l.logged_at,
          emotion: l.emotion,
          note: l.note ?? undefined,
        })),
    ].sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  }, [behaviourLogs, emotionLogs]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 transition-[background-color] duration-[600ms] ease-out">
      <header>
        <h1 className="font-display text-3xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Mood tracker
        </h1>
        <p className="mt-2 font-body text-base text-[var(--text-secondary)]">
          Track emotions, activities, and energy to spot patterns.
        </p>
      </header>
      <BehaviourTrackerForm />
      <WeeklyBehaviourHeatmap entries={heatmapEntries} loading={loading} />
      <BehaviourInsightsCard logs={weekLogs} ready={!loading} />
    </div>
  );
}
