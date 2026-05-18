"use client";

import { AnimatePresence } from "framer-motion";
import { useEmoSenseStore } from "@/lib/store";
import Toast from "@/src/components/ui/Toast";

export default function ToastHost() {
  const toasts = useEmoSenseStore((s) => s.toasts);
  const removeToast = useEmoSenseStore((s) => s.removeToast);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-[min(100vw-2rem,360px)] flex-col gap-3"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
