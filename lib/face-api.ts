import type { FaceExpressions } from "@/lib/types";

const WEIGHTS_ROOT =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

let loadPromise: Promise<void> | null = null;

export async function loadFaceApiModels(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const faceapi = await import("face-api.js");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(WEIGHTS_ROOT),
      faceapi.nets.faceLandmark68Net.loadFromUri(WEIGHTS_ROOT),
      faceapi.nets.faceExpressionNet.loadFromUri(WEIGHTS_ROOT),
    ]);
  })();
  return loadPromise;
}

export type DetectionResult = {
  expressions: FaceExpressions;
  dominant: { label: string; score: number };
  box: { x: number; y: number; width: number; height: number };
};

function dominantExpression(expressions: FaceExpressions): {
  label: string;
  score: number;
} {
  let label = "neutral";
  let score = 0;
  for (const [key, value] of Object.entries(expressions)) {
    if (value > score) {
      label = key;
      score = value;
    }
  }
  return { label, score };
}

function mapLabel(label: string): string {
  const map: Record<string, string> = {
    happy: "Joy",
    sad: "Sadness",
    angry: "Anger",
    fearful: "Fear",
    surprised: "Surprise",
    disgusted: "Disgust",
    neutral: "Calm",
  };
  return map[label] ?? label;
}

export async function detectFromVideo(
  video: HTMLVideoElement
): Promise<DetectionResult | null> {
  const faceapi = await import("face-api.js");
  await loadFaceApiModels();

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  if (!detection) return null;

  const expressions = detection.expressions as unknown as FaceExpressions;
  const dom = dominantExpression(expressions);
  const box = detection.detection.box;

  return {
    expressions,
    dominant: {
      label: mapLabel(dom.label),
      score: dom.score,
    },
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
  };
}

export async function detectFromImage(
  image: HTMLImageElement
): Promise<DetectionResult | null> {
  const faceapi = await import("face-api.js");
  await loadFaceApiModels();

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  if (!detection) return null;

  const expressions = detection.expressions as unknown as FaceExpressions;
  const dom = dominantExpression(expressions);
  const box = detection.detection.box;

  return {
    expressions,
    dominant: {
      label: mapLabel(dom.label),
      score: dom.score,
    },
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
  };
}
