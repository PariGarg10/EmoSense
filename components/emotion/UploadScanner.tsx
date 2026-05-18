"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/components/ui/Button";
import EmotionResultsPanel from "@/components/emotion/EmotionResultsPanel";
import { detectFromImage, loadFaceApiModels } from "@/lib/face-api";
import type { FaceExpressions } from "@/lib/types";
import { useEmoSenseStore } from "@/lib/store";

export default function UploadScanner() {
  const [preview, setPreview] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    dominant: string;
    confidencePct: number;
    expressions: FaceExpressions;
  } | null>(null);

  const setLastScan = useEmoSenseStore((s) => s.setLastScan);
  const addActivity = useEmoSenseStore((s) => s.addActivity);
  const addToast = useEmoSenseStore((s) => s.addToast);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const analyse = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    setBusy(true);
    setError(null);
    try {
      await loadFaceApiModels();
      const detection = await detectFromImage(img);
      if (!detection) {
        setResult(null);
        setError("No clear face found in this photo.");
        return;
      }
      const confidencePct = Math.round(detection.dominant.score * 100);
      setResult({
        dominant: detection.dominant.label,
        confidencePct,
        expressions: detection.expressions,
      });
      setLastScan({
        emotion: detection.dominant.label,
        confidence: confidencePct,
      });
    } catch {
      setError("Analysis failed. Check your internet connection for first-time model download.");
    } finally {
      setBusy(false);
    }
  }, [setLastScan]);

  function handleSave() {
    if (!result) return;
    addActivity({
      emotion: result.dominant,
      note: "From photo upload",
    });
    addToast({
      variant: "success",
      message: "Saved this scan to your activity list.",
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
      <div
        {...getRootProps()}
        className={[
          "flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-[var(--motion-duration)] ease-out",
          isDragActive
            ? "border-[var(--accent-primary)] bg-[var(--glow)]"
            : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[rgba(91,141,239,0.45)]",
        ].join(" ")}
      >
        <input {...getInputProps()} />

        {!preview ? (
          <>
            <div className="emosense-upload-icon text-[var(--accent-primary)]" aria-hidden>
              <svg width="56" height="56" viewBox="0 0 64 64" className="mx-auto">
                <path
                  d="M12 44h40v4H12v-4zm8-8l8-10 10 12 6-8 10 14H20z"
                  fill="currentColor"
                  opacity="0.35"
                />
                <path
                  d="M20 24h24v4H20v-4zm12-12v8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                <path d="M28 20h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">
              Upload a photo
            </h3>
            <p className="mt-2 max-w-md text-[var(--text-secondary)]">
              Drag and drop, or tap to choose a picture. Works if the camera is not available.
            </p>
          </>
        ) : (
          <div className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={preview}
              alt="Uploaded preview for emotion scan"
              className="mx-auto max-h-[420px] rounded-2xl object-contain"
              onLoad={() => setError(null)}
            />
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={analyse} disabled={busy}>
            {busy ? "Analysing…" : "Analyse photo"}
          </Button>
          {error && (
            <p className="text-sm text-[var(--accent-alert)]" role="status">
              {error}
            </p>
          )}
        </div>
      )}

      {result && (
        <EmotionResultsPanel
          dominant={result.dominant}
          confidencePct={result.confidencePct}
          expressions={result.expressions}
          onSaveToLog={handleSave}
        />
      )}
    </div>
  );
}
