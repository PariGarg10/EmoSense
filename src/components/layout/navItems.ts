import type { Icon } from "@phosphor-icons/react";
import {
  BookOpen,
  Camera,
  ChartLine,
  ClipboardText,
  Gear,
  House,
} from "@phosphor-icons/react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: Icon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", shortLabel: "Home", icon: House },
  {
    href: "/emotion-scan",
    label: "Read a face",
    shortLabel: "Scan",
    icon: Camera,
  },
  {
    href: "/behaviour-tracker",
    label: "Mood tracker",
    shortLabel: "Mood",
    icon: ChartLine,
  },
  {
    href: "/emotion-dictionary",
    label: "Dictionary",
    shortLabel: "Dict",
    icon: BookOpen,
  },
  {
    href: "/reports",
    label: "Reports",
    shortLabel: "Reports",
    icon: ClipboardText,
  },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Gear },
];
