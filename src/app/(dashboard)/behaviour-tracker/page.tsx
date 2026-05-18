"use client";

import dynamic from "next/dynamic";
import BehaviourTrackerForm from "@/src/components/behaviour/BehaviourTrackerForm";
import BehaviourInsightsCard from "@/src/components/emotion/BehaviourInsightsCard";

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
      <WeeklyBehaviourHeatmap />
      <BehaviourInsightsCard />
    </div>
  );
}
