"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/src/components/layout/navItems";

export type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--emotion-surface,#161C26)] transition-[width,background-color] duration-300 ease-out md:flex",
        collapsed ? "w-[60px]" : "w-[240px]",
      )}
      aria-label="Section navigation"
    >
      <SidebarBrand collapsed={collapsed} />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "flex min-h-[44px] items-center gap-3 rounded-md px-3 text-[var(--text-secondary)] transition-[background-color,color,border-color] duration-300 ease-out",
                collapsed && "justify-center px-0",
                active
                  ? "border-l-[3px] border-l-[var(--emotion-accent,#5B8DEF)] bg-[color-mix(in_srgb,var(--emotion-accent,#5B8DEF)_15%,transparent)] text-[var(--emotion-accent,#5B8DEF)]"
                  : "border-l-[3px] border-l-transparent hover:bg-[var(--glow)] hover:text-[var(--text-primary)]",
              )}
            >
              <Icon
                size={22}
                weight={active ? "fill" : "duotone"}
                aria-hidden
                className="shrink-0"
              />
              {!collapsed && (
                <span className="truncate font-body text-sm font-medium">
                  {item.label}
                </span>
              )}
              {collapsed && <span className="sr-only">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="mx-2 mb-4 flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <CaretDoubleRight size={20} aria-hidden />
        ) : (
          <>
            <CaretDoubleLeft size={20} aria-hidden />
            <span className="font-body text-sm">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={clsx("px-4 py-5", collapsed && "px-2 text-center")}>
      <Link
        href="/dashboard"
        className="block rounded-md focus-visible:outline focus-visible:outline-offset-2"
      >
        <p
          className={clsx(
            "font-display font-bold text-[var(--emotion-accent,#5B8DEF)] transition-[font-size] duration-300",
            collapsed ? "text-lg" : "text-2xl",
          )}
        >
          {collapsed ? "E" : "EmoSense"}
        </p>
      </Link>
    </div>
  );
}
