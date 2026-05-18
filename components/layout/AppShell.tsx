"use client";

import type { ReactNode } from "react";
import DashboardShell from "@/src/components/layout/DashboardShell";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

/** @deprecated Prefer the `(dashboard)` layout; wraps children in DashboardShell. */
export default function AppShell({ children }: AppShellProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
