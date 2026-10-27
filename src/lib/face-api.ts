// Loads face-api.js weights from /public/models when present, otherwise from CDN.
// Local override: place weights in /public/models/ (see repo docs).

import * as faceapi from "face-api.js";

let modelsLoaded = false;
let loading: Promise<void> | null = null;

/** Pinned release so CDN URLs stay stable. */
const CDN_WEIGHTS_BASE =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

const WEIGHT_URIS = ["/models", CDN_WEIGHTS_BASE] as const;

async function loadModelsFromUri(baseUri: string): Promise<void> {
  const base = baseUri.replace(/\/$/, "");
  // Only the detector and expression nets are needed (landmarks are unused).
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(base),
    faceapi.nets.faceExpressionNet.loadFromUri(base),
  ]);
}

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  // De-duplicate concurrent callers (camera boot + upload tab + prefetch).
  loading ??= (async () => {
    let lastError: unknown;
    for (const uri of WEIGHT_URIS) {
      try {
        await loadModelsFromUri(uri);
        modelsLoaded = true;
        return;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  })();
  try {
    await loading;
  } finally {
    if (!modelsLoaded) loading = null;
  }
}

/** For “Retry” after a failed load (e.g. offline then back online). */
export function resetFaceModelsLoaded(): void {
  modelsLoaded = false;
  loading = null;
}

// 320px input is ~2x faster than the 416 default and accurate enough for webcams.
const videoOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
const imageOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });

async function detectFromVideo(videoEl: HTMLVideoElement) {
  return faceapi.detectSingleFace(videoEl, videoOptions).withFaceExpressions();
}

async function detectFromImage(imgEl: HTMLImageElement) {
  return faceapi.detectSingleFace(imgEl, imageOptions).withFaceExpressions();
}

function getTopEmotion(expressions: faceapi.FaceExpressions): {
  emotion: string;
  confidence: number;
} {
  const map: Record<string, string> = {
    happy: "joy",
    sad: "sadness",
    angry: "anger",
    fearful: "fear",
    surprised: "surprise",
    disgusted: "disgust",
    neutral: "calm",
  };
  const sorted = expressions.asSortedArray();
  const top = sorted[0];
  const key = top.expression;
  const value = top.probability;
  return {
    emotion: map[key] ?? key,
    confidence: Math.round(value * 100),
  };
}

export { detectFromVideo, detectFromImage, getTopEmotion };
