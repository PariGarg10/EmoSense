"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/src/components/layout/Sidebar";
import BottomNav from "@/src/components/layout/BottomNav";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--emotion-bg,#0D1117)] text-[var(--emotion-text,var(--text-primary))] transition-[background-color,color] duration-[600ms] ease-out">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main className="flex-1 overflow-y-auto p-6 pb-28 md:pb-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
