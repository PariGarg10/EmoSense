"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useId, useRef } from "react";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  titleId?: string;
  children: ReactNode;
  className?: string;
};

export default function Modal({
  open,
  onClose,
  titleId: titleIdProp,
  children,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const autoTitleId = useId();
  const titleId = titleIdProp ?? autoTitleId;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-layer"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={clsx(
              "relative z-10 max-h-[min(100dvh-2rem,900px)] w-full max-w-[640px] overflow-y-auto rounded-xl bg-[var(--emotion-surface,#1E2738)] px-6 pb-6 pt-12 shadow-2xl",
              className,
            )}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full text-2xl leading-none text-[var(--text-primary)] opacity-80 transition-opacity hover:opacity-100"
              aria-label="Close"
            >
              ×
            </button>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
