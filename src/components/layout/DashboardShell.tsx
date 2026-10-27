"use client";

import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "@/src/components/layout/Sidebar";
import BottomNav from "@/src/components/layout/BottomNav";
import DailyReminder from "@/src/components/layout/DailyReminder";

const COLLAPSED_KEY = "emosense-sidebar-collapsed";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }

  return (
    <div className="flex min-h-screen bg-[var(--emotion-bg,#0D1117)] text-[var(--emotion-text,var(--text-primary))] transition-[background-color,color] duration-[600ms] ease-out">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--bg-elevated)] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      <main id="main-content" className="min-w-0 flex-1 overflow-y-auto p-6 pb-28 md:h-screen md:pb-6 print:h-auto print:overflow-visible print:p-0">
        {children}
      </main>

      <BottomNav />
      <DailyReminder />
    </div>
  );
}
