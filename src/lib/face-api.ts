// MODEL FILES — download from:
// github.com/justadudewhohacks/face-api.js/tree/master/weights
// Place ALL these files in /public/models/:
//   tiny_face_detector_model-weights_manifest.json
//   tiny_face_detector_model-shard1
//   face_expression_recognition_model-weights_manifest.json
//   face_expression_recognition_model-shard1
//   face_landmark_68_tiny_model-weights_manifest.json
//   face_landmark_68_tiny_model-shard1

import * as faceapi from 'face-api.js'

let modelsLoaded = false

async function loadModels(): Promise<void> {
  if (modelsLoaded) return
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
  ])
  modelsLoaded = true
}

async function detectFromVideo(videoEl: HTMLVideoElement) {
  return faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceExpressions()
}

async function detectFromImage(imgEl: HTMLImageElement) {
  return faceapi
    .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions()
}

function getTopEmotion(expressions: faceapi.FaceExpressions): {
  emotion: string
  confidence: number
} {
  const map: Record<string, string> = {
    happy: 'joy',
    sad: 'sadness',
    angry: 'anger',
    fearful: 'fear',
    surprised: 'surprise',
    disgusted: 'disgust',
    neutral: 'calm',
  }
  const sorted = expressions.asSortedArray()
  const top = sorted[0]
  const key = top.expression
  const value = top.probability
  return {
    emotion: map[key] ?? key,
    confidence: Math.round(value * 100),
  }
}

export { loadModels, detectFromVideo, detectFromImage, getTopEmotion }
