"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { Toast as ToastData } from "@/src/lib/store";

export type ToastProps = ToastData & {
  onDismiss: () => void;
};

export default function Toast(props: ToastProps) {
  const { variant, message, onDismiss } = props;
  return (
    <motion.div
      layout
      initial={{ x: 56, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      role="status"
      className={clsx(
        "pointer-events-auto w-full min-h-[44px] rounded-lg border border-[var(--border)] py-3 pl-4 pr-3 text-left font-body text-sm font-medium text-[var(--text-primary)] shadow-lg",
        "border-l-4 border-l-[var(--emotion-accent)] bg-[var(--bg-elevated)]",
        variant === "success" && "ring-1 ring-[var(--accent-soft)]/15",
        variant === "error" && "ring-1 ring-[var(--accent-alert)]/20",
        variant === "info" && "ring-1 ring-[var(--accent-primary)]/15",
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="w-full text-left"
      >
        <span className="sr-only">Dismiss notification. </span>
        {message}
      </button>
    </motion.div>
  );
}
