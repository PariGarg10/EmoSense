"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import EmotionResultsPanel from "@/components/emotion/EmotionResultsPanel";
import { detectFromVideo, loadFaceApiModels } from "@/lib/face-api";
import type { FaceExpressions } from "@/lib/types";
import { useEmoSenseStore } from "@/lib/store";

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    dominant: string;
    confidencePct: number;
    expressions: FaceExpressions;
  } | null>(null);

  const setLastScan = useEmoSenseStore((s) => s.setLastScan);
  const addActivity = useEmoSenseStore((s) => s.addActivity);
  const addToast = useEmoSenseStore((s) => s.addToast);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError(
          "Camera could not start. You can switch to Upload photo or check browser permissions."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const drawBox = useCallback(
    (box: { x: number; y: number; width: number; height: number } | null) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const { clientWidth, clientHeight } = video;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!box) return;

      const scaleX = clientWidth / video.videoWidth;
      const scaleY = clientHeight / video.videoHeight;

      ctx.strokeStyle = "rgba(91, 141, 239, 0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x * scaleX,
        box.y * scaleY,
        box.width * scaleX,
        box.height * scaleY
      );
    },
    []
  );

  const analyse = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    setError(null);
    try {
      await loadFaceApiModels();
      const detection = await detectFromVideo(video);
      if (!detection) {
        setResult(null);
        drawBox(null);
        setError("No clear face found. Try brighter light or move closer.");
        return;
      }

      const confidencePct = Math.round(detection.dominant.score * 100);
      setResult({
        dominant: detection.dominant.label,
        confidencePct,
        expressions: detection.expressions,
      });
      drawBox(detection.box);
      setLastScan({
        emotion: detection.dominant.label,
        confidence: confidencePct,
      });
    } catch {
      setError("Analysis failed. Check your internet connection for first-time model download.");
    } finally {
      setBusy(false);
    }
  }, [drawBox, setLastScan]);

  function handleSave() {
    if (!result) return;
    addActivity({
      emotion: result.dominant,
      note: "From camera scan",
    });
    addToast({
      variant: "success",
      message: "Saved this scan to your activity list.",
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-glow)]">
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={analyse} disabled={busy}>
          {busy ? "Analysing…" : "Analyse"}
        </Button>
        {error && (
          <p className="text-sm text-[var(--accent-alert)]" role="status">
            {error}
          </p>
        )}
      </div>

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
