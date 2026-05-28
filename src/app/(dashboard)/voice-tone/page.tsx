"use client";

import { useEffect, useRef, useState } from "react";
import { Microphone, ShieldCheck, Waveform } from "@phosphor-icons/react";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";

type ToneResult = {
  label: string;
  confidence: number;
  averageVolume: number;
  variation: number;
  speakingRatio: number;
  pitchMovement: number;
  guidance: string;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const ANALYSIS_SECONDS = 8;
const MIN_SAMPLES = 12;

function getAudioContext(): AudioContext {
  const audioWindow = window as AudioWindow;
  const Context = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  return new Context();
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], mean: number): number {
  if (!values.length) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function analyseTone(volumes: number[], pitchMovementValues: number[]): ToneResult {
  const averageVolume = average(volumes);
  const variation = standardDeviation(volumes, averageVolume);
  const speakingRatio =
    volumes.filter((value) => value > 0.025).length / Math.max(volumes.length, 1);
  const pitchMovement = average(pitchMovementValues);

  let label = "Steady voice";
  let guidance = "The tone sounds even. This can fit calm, focus, or careful speech.";

  if (speakingRatio < 0.25 || averageVolume < 0.018) {
    label = "Low or quiet voice";
    guidance =
      "The voice signal was quiet or sparse. Ask a gentle check-in question before interpreting emotion.";
  } else if (averageVolume > 0.12 || variation > 0.07) {
    label = "Activated voice";
    guidance =
      "The voice has stronger volume or more movement. It may reflect excitement, stress, urgency, or environmental noise.";
  } else if (pitchMovement > 0.18) {
    label = "Expressive voice";
    guidance =
      "The tone has noticeable movement. Pair this with words, facial cues, and context before deciding what it means.";
  }

  const confidence = Math.max(
    35,
    Math.min(
      92,
      Math.round(45 + speakingRatio * 25 + Math.min(averageVolume * 180, 18) + Math.min(volumes.length / 8, 12)),
    ),
  );

  return {
    label,
    confidence,
    averageVolume: percentage(averageVolume),
    variation: percentage(variation),
    speakingRatio: percentage(speakingRatio),
    pitchMovement: percentage(pitchMovement),
    guidance,
  };
}

export default function VoiceTonePage() {
  const [consented, setConsented] = useState(false);
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ToneResult | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);
  const volumesRef = useRef<number[]>([]);
  const pitchMovementRef = useRef<number[]>([]);
  const listeningRef = useRef(false);

  function cleanupAudio() {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close().catch(() => {});
    frameRef.current = null;
    timerRef.current = null;
    stopTimerRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
  }

  function stopAnalysis() {
    if (!listeningRef.current) return;
    listeningRef.current = false;
    cleanupAudio();
    setListening(false);
    setLiveVolume(0);

    if (volumesRef.current.length < MIN_SAMPLES) {
      setError("Not enough voice signal was captured. Try again in a quieter place.");
      return;
    }

    setResult(analyseTone(volumesRef.current, pitchMovementRef.current));
  }

  async function startAnalysis() {
    if (!consented || listeningRef.current) return;
    setError("");
    setResult(null);
    setElapsed(0);
    setLiveVolume(0);
    volumesRef.current = [];
    pitchMovementRef.current = [];

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone analysis is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioContext = getAudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      startedAtRef.current = Date.now();
      listeningRef.current = true;
      setListening(true);

      const samples = new Uint8Array(analyser.fftSize);

      const readFrame = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        let crossings = 0;
        let previous = samples[0] - 128;

        for (let i = 0; i < samples.length; i += 1) {
          const centered = (samples[i] - 128) / 128;
          sum += centered * centered;
          const current = samples[i] - 128;
          if ((previous < 0 && current >= 0) || (previous >= 0 && current < 0)) {
            crossings += 1;
          }
          previous = current;
        }

        const rms = Math.sqrt(sum / samples.length);
        const pitchMovement = crossings / samples.length;
        volumesRef.current.push(rms);
        pitchMovementRef.current.push(pitchMovement);
        setLiveVolume(percentage(rms));
        frameRef.current = requestAnimationFrame(readFrame);
      };

      readFrame();

      timerRef.current = setInterval(() => {
        setElapsed(Math.min(ANALYSIS_SECONDS, Math.floor((Date.now() - startedAtRef.current) / 1000)));
      }, 250);

      stopTimerRef.current = setTimeout(() => {
        stopAnalysis();
      }, ANALYSIS_SECONDS * 1000);
    } catch (caught) {
      listeningRef.current = false;
      cleanupAudio();
      setListening(false);
      setError(caught instanceof Error ? caught.message : "Microphone could not start.");
    }
  }

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Optional signal
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
          Voice tone analysis
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          Analyse short microphone snippets for volume, steadiness, and tone movement. EmoSense uses this as a supportive clue, not as a diagnosis.
        </p>
      </header>

      <Card className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-[var(--emotion-accent,var(--accent-primary))]/15 p-3 text-[var(--emotion-accent,var(--accent-primary))]">
            <Microphone size={28} aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
              Consent-based microphone check
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Audio is analysed in the browser for {ANALYSIS_SECONDS} seconds. Raw audio is not saved, uploaded, or added to reports in this MVP.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
            className="mt-1"
          />
          <span>
            I understand this is a supportive tone estimate only, and I consent to use the microphone for this local check.
          </span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            disabled={!consented || listening}
            loading={listening}
            onClick={() => void startAnalysis()}
            className="sm:flex-1"
          >
            Start voice check
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!listening}
            onClick={stopAnalysis}
            className="sm:flex-1"
          >
            Finish now
          </Button>
        </div>

        {listening && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Listening locally... {elapsed}/{ANALYSIS_SECONDS}s
              </p>
              <Waveform size={24} className="text-[var(--emotion-accent,var(--accent-primary))]" aria-hidden />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--emotion-accent,var(--accent-primary))] transition-[width] duration-200"
                style={{ width: `${Math.min(100, liveVolume * 5)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Live volume meter only. No transcript is created.
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-[var(--accent-alert)]/40 bg-[var(--accent-alert)]/10 p-4 text-sm text-[var(--accent-alert)]">
            {error}
          </p>
        )}
      </Card>

      {result && (
        <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
                  {result.label}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {result.guidance}
                </p>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--emotion-text,var(--text-secondary))]">
                {result.confidence}% confidence
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Average volume", result.averageVolume],
                ["Tone variation", result.variation],
                ["Speaking signal", result.speakingRatio],
                ["Pitch movement", result.pitchMovement],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4">
                  <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    {label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold text-[var(--emotion-text,var(--text-primary))]">
                    {value}%
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-[var(--emotion-accent,var(--accent-primary))]">
              <ShieldCheck size={28} aria-hidden />
              <h2 className="font-display text-xl font-bold">Safety notes</h2>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li>Voice tone can be affected by microphone quality, distance, masking, background noise, and speech differences.</li>
              <li>Use this result with self-report, context, facial cues, and caregiver or therapist judgment.</li>
              <li>Do not use this as a clinical diagnosis, risk score, or emergency decision tool.</li>
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
