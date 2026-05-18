"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useEmoSenseStore } from "@/lib/store";
import type { ContrastPreset, FontSizePreset, MotionPreset } from "@/lib/types";

const cardClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--emotion-surface)] p-6 md:p-8";

const crisisLinks = [
  { label: "Vandrevala Foundation", href: "https://www.vandrevalafoundation.com/" },
  { label: "iCall", href: "https://icallhelpline.org/" },
  { label: "NIMHANS", href: "tel:08046110007", detail: "080-46110007" },
];

export default function SettingsPage() {
  const sensory = useEmoSenseStore((s) => s.sensory);
  const setSensory = useEmoSenseStore((s) => s.setSensory);
  const addToast = useEmoSenseStore((s) => s.addToast);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  function downloadData() {
    const raw = localStorage.getItem("emosense-store");
    const parsed = raw ? JSON.parse(raw) : {};
    const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emosense-data.json";
    a.click();
    URL.revokeObjectURL(url);
    addToast({ variant: "success", message: "Your data download has started." });
  }

  function deleteAll() {
    if (deleteConfirm.trim().toLowerCase() !== "delete") return;
    localStorage.removeItem("emosense-store");
    addToast({ variant: "info", message: "All local data removed. Reloading…" });
    window.setTimeout(() => window.location.reload(), 600);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
          Settings
        </h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Adjust how EmoSense looks and feels on this device.
        </p>
      </header>

      <section className={`mt-10 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Sensory
        </h2>
        <div className="mt-6 space-y-8">
          <div>
            <p className="font-medium text-[var(--emotion-text,var(--text-primary))]">Font size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["sm", "md", "lg", "xl"] as FontSizePreset[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSensory({ fontSize: size })}
                  className={toggleClass(sensory.fontSize === size)}
                >
                  {size === "sm" ? "Small" : size === "md" ? "Medium" : size === "lg" ? "Large" : "Extra large"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-[var(--emotion-text,var(--text-primary))]">Contrast</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["standard", "high", "low"] as ContrastPreset[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSensory({ contrast: mode })}
                  className={toggleClass(sensory.contrast === mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-[var(--emotion-text,var(--text-primary))]">Motion</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["full", "reduced", "none"] as MotionPreset[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSensory({ motion: mode })}
                  className={toggleClass(sensory.motion === mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`mt-8 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Privacy
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Download a copy of your stored data or remove everything on this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={downloadData}>
            Download data JSON
          </Button>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete all data
          </Button>
        </div>
        {deleteOpen && (
          <div className="mt-4 rounded-xl border border-[var(--accent-alert)]/40 bg-[rgba(224,123,123,0.08)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Type <strong className="text-[var(--text-primary)]">delete</strong> to confirm. This cannot be undone.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type delete"
              className="mt-3 min-h-[44px] w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)]"
              autoComplete="off"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="danger"
                disabled={deleteConfirm.trim().toLowerCase() !== "delete"}
                onClick={deleteAll}
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirm("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className={`mt-8 mb-10 ${cardClass}`}>
        <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
          Support
        </h2>
        <ul className="mt-4 space-y-3">
          {crisisLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[var(--emotion-accent,var(--accent-primary))] underline-offset-4 hover:underline"
                {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {link.label}
                {link.detail ? ` → ${link.detail}` : ""}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function toggleClass(active: boolean) {
  return [
    "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--motion-duration,300ms)]",
    active
      ? "border-[var(--emotion-accent,var(--accent-primary))] bg-[var(--glow)] text-[var(--emotion-text,var(--text-primary))]"
      : "border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]",
  ].join(" ");
}
