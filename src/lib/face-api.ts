// Loads face-api.js weights from /public/models when present, otherwise from CDN.
// Local override: place weights in /public/models/ (see repo docs).

import * as faceapi from "face-api.js";

let modelsLoaded = false;

/** Pinned release so CDN URLs stay stable. */
const CDN_WEIGHTS_BASE =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

const WEIGHT_URIS = ["/models", CDN_WEIGHTS_BASE] as const;

async function loadModelsFromUri(baseUri: string): Promise<void> {
  const base = baseUri.replace(/\/$/, "");
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(base),
    faceapi.nets.faceExpressionNet.loadFromUri(base),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(base),
  ]);
}

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
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
}

/** For “Retry” after a failed load (e.g. offline then back online). */
export function resetFaceModelsLoaded(): void {
  modelsLoaded = false;
}

async function detectFromVideo(videoEl: HTMLVideoElement) {
  return faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceExpressions();
}

async function detectFromImage(imgEl: HTMLImageElement) {
  return faceapi
    .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();
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
