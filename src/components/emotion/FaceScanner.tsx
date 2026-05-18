"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import type { FaceExpressions } from "face-api.js";
import Button from "@/components/ui/Button";
import EmotionFace from "@/src/components/emotion/EmotionFace";
import MoodCard from "@/src/components/emotion/MoodCard";
import {
  applyEmotionTheme,
  clearEmotionTheme,
  getTheme,
} from "@/src/lib/emotionTheme";
import {
  detectFromImage,
  detectFromVideo,
  getTopEmotion,
  loadModels,
  resetFaceModelsLoaded,
} from "@/src/lib/face-api";
import { useEmoSenseStore } from "@/lib/store";
import clsx from "clsx";

export type FaceScannerProps = {
  onResult: (emotion: string, confidence: number) => void;
};

const CHART_ORDER = [
  { apiKey: "happy" as const, themeKey: "joy", label: "Joy" },
  { apiKey: "sad" as const, themeKey: "sadness", label: "Sad" },
  { apiKey: "angry" as const, themeKey: "anger", label: "Anger" },
  { apiKey: "fearful" as const, themeKey: "fear", label: "Fear" },
  { apiKey: "surprised" as const, themeKey: "surprise", label: "Surprise" },
  { apiKey: "disgusted" as const, themeKey: "disgust", label: "Disgust" },
  { apiKey: "neutral" as const, themeKey: "calm", label: "Calm" },
];

async function acquireCameraStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is not supported in this browser.");
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error("Camera needs HTTPS (or localhost). Open the app over a secure URL.");
  }
  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: "user" }, width: { ideal: 1280 } }, audio: false },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ];
  let last: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

function resolveThemeLookup(emotion: string): string {
  const k = emotion.trim().toLowerCase();
  if (k === "scared" || k === "scare") return "fear";
  return k;
}

function buildChartSnapshot(expressions: FaceExpressions) {
  return CHART_ORDER.map(({ apiKey, themeKey, label }) => {
    const raw = expressions[apiKey];
    const value = Math.round((typeof raw === "number" ? raw : 0) * 100);
    return {
      name: label,
      value,
      fill: getTheme(themeKey).accentColor,
    };
  });
}

function readAccentSoft(): string {
  if (typeof window === "undefined") return "#7ec8a4";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent-soft")
    .trim();
  return v || "#7ec8a4";
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function UploadArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12l7-7 7 7" />
    </svg>
  );
}

export default function FaceScanner({ onResult }: FaceScannerProps) {
  const [tab, setTab] = useState<"camera" | "upload">("camera");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [liveEmotion, setLiveEmotion] = useState<{
    emotion: string;
    confidence: number;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    emotion: string;
    confidence: number;
    capturedAt: Date;
  } | null>(null);
  const [chartData, setChartData] = useState<
    { name: string; value: number; fill: string }[] | null
  >(null);
  const [explanation, setExplanation] = useState("");
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [modelsLoadError, setModelsLoadError] = useState<string | null>(null);
  const [cameraBooting, setCameraBooting] = useState(false);
  const [showNoFaceHint, setShowNoFaceHint] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastExpressionsRef = useRef<FaceExpressions | null>(null);
  const noFaceSinceRef = useRef<number | null>(null);
  const startTickingRef = useRef<(() => void) | null>(null);
  const reduceMotion = useReducedMotion();

  const addActivity = useEmoSenseStore((s) => s.addActivity);
  const addToast = useEmoSenseStore((s) => s.addToast);
  const setLastScan = useEmoSenseStore((s) => s.setLastScan);

  const drawBox = useCallback(
    (
      box: { x: number; y: number; width: number; height: number } | null,
    ) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const w = video.clientWidth;
      const h = video.clientHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      if (!box) return;

      const scaleX = w / (video.videoWidth || w);
      const scaleY = h / (video.videoHeight || h);
      ctx.strokeStyle = readAccentSoft();
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x * scaleX,
        box.y * scaleY,
        box.width * scaleX,
        box.height * scaleY,
      );
    },
    [],
  );

  const finalizeResult = useCallback(
    async (emotion: string, confidence: number, expressions: FaceExpressions) => {
      applyEmotionTheme(emotion);
      onResult(emotion, confidence);
      setLastScan({
        emotion: getTheme(resolveThemeLookup(emotion)).label,
        confidence,
      });
      setResult({ emotion, confidence, capturedAt: new Date() });
      setChartData(buildChartSnapshot(expressions));
      setExplanationLoading(true);
      setExplanation("");
      const label = getTheme(resolveThemeLookup(emotion)).label;
      try {
        const res = await fetch("/api/explain-emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotion: label, confidence }),
        });
        const data = (await res.json()) as { explanation?: string };
        setExplanation(data.explanation ?? "");
      } catch {
        setExplanation(
          "We could not load a longer explanation. The scan still shows how your face looked in that moment.",
        );
      } finally {
        setExplanationLoading(false);
      }
    },
    [onResult, setLastScan],
  );

  const handleCaptureMoment = useCallback(() => {
    const expr = lastExpressionsRef.current;
    const live = liveEmotion;
    if (!expr || !live) return;
    void finalizeResult(live.emotion, live.confidence, expr);
  }, [finalizeResult, liveEmotion]);

  const handleScanAgain = useCallback(() => {
    clearEmotionTheme();
    setResult(null);
    setChartData(null);
    setExplanation("");
    setExplanationLoading(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleSaveToLog = useCallback(() => {
    if (!result) return;
    const label = getTheme(resolveThemeLookup(result.emotion)).label;
    addActivity({
      emotion: label,
      note: "From face scanner",
    });
    addToast({
      variant: "success",
      message: "Saved this scan to your activity list.",
    });
  }, [addActivity, addToast, result]);

  useEffect(() => {
    if (tab !== "camera") return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    setCameraBooting(true);
    setCameraError(false);
    setModelsLoadError(null);
    setModelsLoaded(false);
    startTickingRef.current = null;

    let detachVideo: HTMLVideoElement | null = null;

    const tick = async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      try {
        const det = await detectFromVideo(v);
        if (!det?.expressions) {
          setFaceDetected(false);
          setLiveEmotion(null);
          lastExpressionsRef.current = null;
          drawBox(null);
          noFaceSinceRef.current ??= performance.now();
          if (performance.now() - noFaceSinceRef.current >= 3000) {
            setShowNoFaceHint(true);
          }
          return;
        }
        noFaceSinceRef.current = null;
        setShowNoFaceHint(false);
        setFaceDetected(true);
        const top = getTopEmotion(det.expressions);
        setLiveEmotion(top);
        applyEmotionTheme(top.emotion);
        lastExpressionsRef.current = det.expressions;
        const box = det.detection.box;
        drawBox({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        });
      } catch {
        setFaceDetected(false);
        drawBox(null);
      }
    };

    const startTicking = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        void tick();
      }, 500);
    };
    startTickingRef.current = startTicking;

    async function boot() {
      try {
        const stream = await acquireCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          detachVideo = video;
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setCameraBooting(false);

        try {
          await loadModels();
          if (cancelled) return;
          setModelsLoaded(true);
          setModelsLoadError(null);
          startTicking();
        } catch {
          if (!cancelled) {
            resetFaceModelsLoaded();
            setModelsLoaded(false);
            setModelsLoadError(
              "Face reader models could not load. Check your internet connection, then tap Retry.",
            );
          }
        }
      } catch {
        if (!cancelled) {
          setCameraError(true);
          setCameraBooting(false);
          setTab("upload");
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
      startTickingRef.current = null;
      if (intervalId) clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (detachVideo) detachVideo.srcObject = null;
      drawBox(null);
      setCameraBooting(false);
      noFaceSinceRef.current = null;
      setShowNoFaceHint(false);
    };
  }, [tab, drawBox]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;

      setUploadBusy(true);
      setResult(null);
      setChartData(null);
      setExplanation("");
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      try {
        await loadModels();
        const probe = document.createElement("img");
        await new Promise<void>((resolve, reject) => {
          probe.onload = () => resolve();
          probe.onerror = () => reject(new Error("img load"));
          probe.src = url;
        });
        const det = await detectFromImage(probe);
        if (!det?.expressions) {
          addToast({
            variant: "error",
            message: "No clear face found in that photo. Try another image.",
          });
          return;
        }
        const top = getTopEmotion(det.expressions);
        await finalizeResult(top.emotion, top.confidence, det.expressions);
      } catch {
        addToast({
          variant: "error",
          message: "Could not read that image. Try a different file.",
        });
      } finally {
        setUploadBusy(false);
      }
    },
    [addToast, finalizeResult],
  );

  const [modelsRetryBusy, setModelsRetryBusy] = useState(false);

  const handleRetryModels = useCallback(async () => {
    resetFaceModelsLoaded();
    setModelsLoadError(null);
    setModelsRetryBusy(true);
    try {
      await loadModels();
      setModelsLoaded(true);
      startTickingRef.current?.();
    } catch {
      setModelsLoadError(
        "Face reader models could not load. Check your internet connection, then tap Retry.",
      );
    } finally {
      setModelsRetryBusy(false);
    }
  }, []);

  const dropZoneClick = () => fileInputRef.current?.click();

  const liveLabel = liveEmotion
    ? getTheme(resolveThemeLookup(liveEmotion.emotion)).label
    : "";

  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Scan source"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "camera"}
          onClick={() => setTab("camera")}
          className={clsx(
            "min-h-[44px] rounded-lg px-4 font-body text-sm font-medium transition-colors",
            tab === "camera"
              ? "bg-[var(--emotion-accent,var(--accent-primary))] text-white"
              : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          )}
        >
          Camera
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upload"}
          onClick={() => setTab("upload")}
          className={clsx(
            "min-h-[44px] rounded-lg px-4 font-body text-sm font-medium transition-colors",
            tab === "upload"
              ? "bg-[var(--emotion-accent,var(--accent-primary))] text-white"
              : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          )}
        >
          Upload
        </button>
      </div>

      {cameraError && (
        <p className="text-sm text-[var(--accent-alert)]" role="status">
          Camera could not start (permissions, no camera, or not HTTPS). Use{" "}
          <strong className="text-[var(--text-primary)]">Upload</strong> above, or allow camera for this site.
        </p>
      )}

      {modelsLoadError && tab === "camera" && (
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4 text-sm text-[var(--text-secondary)]"
          role="status"
        >
          <p>{modelsLoadError}</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            loading={modelsRetryBusy}
            onClick={() => void handleRetryModels()}
          >
            Retry loading models
          </Button>
        </div>
      )}

      {tab === "camera" && (
        <section aria-labelledby="camera-scan-heading" className="space-y-4">
          <h2 id="camera-scan-heading" className="sr-only">
            Live camera scan
          </h2>

          {cameraBooting && (
            <p
              className={clsx(
                "text-center font-body text-[var(--text-secondary)]",
                !reduceMotion && "animate-pulse",
              )}
            >
              Setting up face reader…
            </p>
          )}

          {!cameraBooting && (
            <div className="space-y-2">
              {modelsLoaded && (
                <span className="sr-only">Face reader models ready.</span>
              )}
              <div className="flex items-center justify-center gap-2">
                <span
                  className={clsx(
                    "h-2.5 w-2.5 rounded-full transition-colors duration-300",
                    faceDetected ? "bg-[var(--emotion-accent)]" : "bg-[var(--text-muted)]",
                  )}
                  aria-hidden
                />
                <p className="font-body text-sm text-[var(--text-secondary)]">
                  {faceDetected ? "Face detected!" : "Reading your face…"}
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-lg">
                <div
                  className={clsx(
                    "relative overflow-hidden rounded-2xl border-2 transition-[box-shadow,border-color] duration-500 ease-out",
                  )}
                  style={{
                    borderColor: "var(--emotion-accent, var(--border))",
                    boxShadow:
                      "0 0 28px color-mix(in srgb, var(--emotion-accent, var(--accent-primary)) 35%, transparent)",
                  }}
                >
                  <video
                    ref={videoRef}
                    className="block w-full object-cover"
                    style={{ aspectRatio: "4 / 3" }}
                    muted
                    playsInline
                    autoPlay
                  />
                  <canvas
                    ref={canvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl"
                    aria-hidden
                  />
                </div>

                <div className="mt-6 flex flex-col items-center gap-2 text-center transition-all duration-500">
                  <EmotionFace
                    emotion={liveEmotion?.emotion ?? "calm"}
                    size="md"
                    animated
                    className="transition-transform duration-500"
                  />
                  <p
                    className="font-display text-[28px] font-bold transition-colors duration-500"
                    style={{ color: "var(--emotion-accent)" }}
                  >
                    {liveLabel || "—"}
                  </p>
                  {liveEmotion != null && (
                    <p className="font-mono text-sm text-[var(--text-secondary)] transition-opacity duration-300">
                      {liveEmotion.confidence}% sure
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!liveEmotion || !!result}
                    onClick={handleCaptureMoment}
                  >
                    Capture this moment
                  </Button>
                  {showNoFaceHint && !faceDetected && (
                    <p className="text-center text-sm text-[var(--text-muted)]">
                      No face? Move closer ↑
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "upload" && (
        <section aria-labelledby="upload-scan-heading" className="space-y-4">
          <h2 id="upload-scan-heading" className="sr-only">
            Upload photo
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          {!previewUrl && (
            <button
              type="button"
              onClick={dropZoneClick}
              disabled={uploadBusy}
              className={clsx(
                "flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors duration-300",
                !reduceMotion && "[&_svg]:animate-bounce",
              )}
              style={{
                borderColor:
                  "color-mix(in srgb, var(--emotion-accent, var(--accent-primary)) 45%, var(--border))",
              }}
            >
              <UploadArrowIcon className="text-[var(--emotion-accent,var(--accent-primary))]" />
              <p className="mt-4 font-display text-lg font-bold text-[var(--text-primary)]">
                Drop a photo or tap to browse
              </p>
              <p className="mt-2 max-w-sm font-body text-sm text-[var(--text-secondary)]">
                Works best with clear face photos
              </p>
            </button>
          )}

          {previewUrl && (
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected preview"
                className="block w-full object-contain"
              />
              {uploadBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-body text-white">
                  Reading face…
                </div>
              )}
            </div>
          )}

          <p className="flex items-center justify-center gap-2 text-center text-xs text-[var(--text-muted)]">
            <LockIcon className="shrink-0 opacity-80" />
            Your photo never leaves this device
          </p>
        </section>
      )}

      {result && chartData && (
        <motion.section
          initial={reduceMotion ? false : { y: 40, opacity: 0 }}
          animate={reduceMotion ? false : { y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <MoodCard
            variant="inline"
            emotion={result.emotion}
            timestamp={result.capturedAt}
            onAddReason={(reason) => {
              const label = getTheme(resolveThemeLookup(result.emotion)).label;
              addActivity({ emotion: label, note: reason });
              addToast({ variant: "success", message: "Reason saved." });
            }}
            onDismiss={() => {}}
          />

          <div className="max-h-[160px] w-full min-h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 4, right: 40, top: 4, bottom: 4 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{
                    fill: "var(--emotion-text, var(--text-secondary))",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={12}>
                  {chartData.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v: number) => `${v}%`}
                    style={{
                      fill: "var(--emotion-text, var(--text-primary))",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-xl border border-[var(--border)]/50 p-4"
            style={{
              backgroundColor: "var(--emotion-surface, var(--bg-elevated))",
              borderLeftWidth: 3,
              borderLeftColor: "var(--emotion-accent, var(--accent-primary))",
            }}
          >
            <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--emotion-text,var(--text-muted))] opacity-80">
              What this emotion means
            </h3>
            {explanationLoading ? (
              <div className="mt-3 space-y-2" aria-busy="true">
                <div className="h-3 w-full animate-pulse rounded bg-[var(--emotion-text)]/10" />
                <div className="h-3 w-[83%] animate-pulse rounded bg-[var(--emotion-text)]/10" />
                <div className="h-3 w-[66%] animate-pulse rounded bg-[var(--emotion-text)]/10" />
              </div>
            ) : (
              <p className="mt-3 font-body text-sm leading-relaxed text-[var(--emotion-text,var(--text-secondary))]">
                {explanation}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <Button
              type="button"
              className="w-full sm:flex-1"
              onClick={handleSaveToLog}
            >
              Save to log
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:flex-1"
              onClick={handleScanAgain}
            >
              Scan again
            </Button>
          </div>
        </motion.section>
      )}
    </div>
  );
}
