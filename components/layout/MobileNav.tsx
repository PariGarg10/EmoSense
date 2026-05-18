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

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md sm:hidden"
      aria-label="Primary"
    >
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className="snap-start shrink-0">
              <Link
                href={item.href}
                className={clsx(
                  "flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-medium transition-transform duration-[var(--motion-duration)] ease-out",
                  active
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon size={24} weight={active ? "fill" : "duotone"} aria-hidden />
                <span className="max-w-[72px] truncate text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
