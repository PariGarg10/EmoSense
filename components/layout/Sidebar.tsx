"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Camera,
  ChartLine,
  BookOpen,
  Users,
  ClipboardText,
  Gear,
} from "@phosphor-icons/react";
import clsx from "clsx";

const navItems = [
  { label: "Home", href: "/dashboard", icon: House },
  { label: "Emotion Scan", href: "/emotion-scan", icon: Camera },
  { label: "Behaviour Tracker", href: "/behaviour-tracker", icon: ChartLine },
  { label: "Emotion Dictionary", href: "/emotion-dictionary", icon: BookOpen },
  { label: "Social Stories", href: "/social-stories", icon: Users },
  { label: "Reports", href: "/reports", icon: ClipboardText },
  { label: "Settings", href: "/settings", icon: Gear },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        hidden
        h-screen
        shrink-0
        border-r
        border-[var(--border)]
        bg-[var(--bg-surface)]
        sm:flex
        sm:w-[48px]
        sm:flex-col
        sm:px-2
        sm:py-4
        lg:w-[240px]
        lg:px-3
      "
      aria-label="Section navigation"
    >
      <div className="mb-8 px-1 pt-2 lg:px-2">
        <Link href="/" className="block rounded-xl focus-visible:outline focus-visible:outline-offset-2">
          <p className="font-display text-lg font-extrabold text-[var(--text-primary)] lg:text-2xl">
            <span aria-hidden>◉</span>{" "}
            <span className="hidden lg:inline">EmoSense</span>
          </p>
          <p className="mt-1 hidden text-sm text-[var(--text-secondary)] lg:block">
            Emotional understanding platform
          </p>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-2 py-2 text-[var(--text-secondary)] transition-all duration-[var(--motion-duration)] ease-out hover:scale-[1.02] hover:border hover:border-[rgba(91,141,239,0.35)] hover:bg-[var(--glow)] hover:text-[var(--text-primary)] lg:px-3",
                active && "border border-[rgba(91,141,239,0.45)] bg-[var(--glow)] text-[var(--text-primary)]"
              )}
            >
              <Icon
                size={22}
                weight={active ? "fill" : "duotone"}
                aria-hidden
                className="shrink-0"
              />
              <span className="hidden truncate font-medium lg:inline">{item.label}</span>
              <span className="sr-only lg:hidden">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
