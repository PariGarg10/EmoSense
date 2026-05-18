"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/src/components/layout/navItems";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--emotion-surface,#161C26)]/95 backdrop-blur-md transition-[background-color] duration-[600ms] ease-out md:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-6 px-1 py-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-md px-1 transition-[color] duration-[600ms] ease-out",
                  active
                    ? "text-[var(--emotion-accent,#5B8DEF)]"
                    : "text-[var(--text-secondary)]",
                )}
              >
                <Icon size={22} weight={active ? "fill" : "duotone"} aria-hidden />
                <span className="max-w-full truncate text-[10px] font-medium leading-tight">
                  {item.shortLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
