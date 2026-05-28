import type { Icon } from "@phosphor-icons/react";
import {
  BookOpen,
  Camera,
  ChartLine,
  ChatCircleText,
  ClipboardText,
  Gear,
  House,
  Microphone,
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
    href: "/voice-tone",
    label: "Voice tone",
    shortLabel: "Voice",
    icon: Microphone,
  },
  {
    href: "/emotion-fusion",
    label: "Fusion",
    shortLabel: "Fusion",
    icon: ChartLine,
  },
  {
    href: "/helpbot",
    label: "Helpbot",
    shortLabel: "Help",
    icon: ChatCircleText,
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
