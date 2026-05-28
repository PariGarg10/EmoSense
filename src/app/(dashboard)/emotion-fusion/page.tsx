"use client";

import { useMemo, useState } from "react";
import { Brain, ShieldCheck } from "@phosphor-icons/react";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";

type EmotionKey = "joy" | "calm" | "sadness" | "anger" | "fear" | "surprise";

type SignalInput = {
  emotion: EmotionKey;
  confidence: number;
};

type FusedEmotion = {
  emotion: EmotionKey;
  score: number;
  reasons: string[];
};

const emotionLabels: Record<EmotionKey, string> = {
  joy: "Joy",
  calm: "Calm",
  sadness: "Sadness",
  anger: "Anger",
  fear: "Fear",
  surprise: "Surprise",
};

const emotionOptions = Object.entries(emotionLabels) as [EmotionKey, string][];

const voiceToEmotion: Record<string, EmotionKey> = {
  quiet: "sadness",
  steady: "calm",
  expressive: "surprise",
  activated: "fear",
};

const textLexicon: Record<EmotionKey, string[]> = {
  joy: ["happy", "good", "great", "excited", "proud", "fun", "love", "smile"],
  calm: ["calm", "okay", "safe", "relaxed", "fine", "steady", "peaceful", "quiet"],
  sadness: ["sad", "tired", "lonely", "hurt", "cry", "miss", "upset", "down"],
  anger: ["angry", "mad", "annoyed", "frustrated", "unfair", "hate", "shout", "irritated"],
  fear: ["scared", "afraid", "worried", "anxious", "panic", "unsafe", "nervous", "stress"],
  surprise: ["surprised", "wow", "sudden", "unexpected", "shock", "confused", "new", "startled"],
};

const signalWeights = {
  face: 0.45,
  voice: 0.3,
  text: 0.25,
};

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreText(text: string): SignalInput & { matchedWords: string[] } {
  const words: string[] = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const scores = emotionOptions.map(([emotion]) => {
    const matchedWords = textLexicon[emotion].filter((word) => words.includes(word));
    return {
      emotion,
      confidence: Math.min(95, matchedWords.length * 24),
      matchedWords,
    };
  });

  const best = scores.sort((a, b) => b.confidence - a.confidence)[0];
  if (!best || best.confidence === 0) {
    return { emotion: "calm", confidence: 20, matchedWords: [] };
  }
  return best;
}

function addSignalScore(
  scores: Record<EmotionKey, FusedEmotion>,
  signalName: string,
  signal: SignalInput,
  weight: number,
) {
  const weightedScore = signal.confidence * weight;
  scores[signal.emotion].score += weightedScore;
  scores[signal.emotion].reasons.push(
    `${signalName}: ${emotionLabels[signal.emotion]} at ${signal.confidence}% confidence`,
  );
}

function fuseSignals(face: SignalInput, voice: SignalInput, text: SignalInput): FusedEmotion[] {
  const scores = emotionOptions.reduce(
    (acc, [emotion]) => {
      acc[emotion] = { emotion, score: 0, reasons: [] };
      return acc;
    },
    {} as Record<EmotionKey, FusedEmotion>,
  );

  addSignalScore(scores, "Face", face, signalWeights.face);
  addSignalScore(scores, "Voice", voice, signalWeights.voice);
  addSignalScore(scores, "Text", text, signalWeights.text);

  return Object.values(scores).sort((a, b) => b.score - a.score);
}

function getConfidenceBand(score: number): string {
  if (score >= 65) return "Strong agreement";
  if (score >= 42) return "Moderate agreement";
  return "Mixed signals";
}

export default function EmotionFusionPage() {
  const [faceEmotion, setFaceEmotion] = useState<EmotionKey>("calm");
  const [faceConfidence, setFaceConfidence] = useState(70);
  const [voiceTone, setVoiceTone] = useState("steady");
  const [voiceConfidence, setVoiceConfidence] = useState(65);
  const [text, setText] = useState("");
  const [showResult, setShowResult] = useState(false);

  const textSignal = useMemo(() => scoreText(text), [text]);
  const voiceSignal = useMemo<SignalInput>(
    () => ({
      emotion: voiceToEmotion[voiceTone] ?? "calm",
      confidence: clampConfidence(voiceConfidence),
    }),
    [voiceConfidence, voiceTone],
  );
  const faceSignal = useMemo<SignalInput>(
    () => ({
      emotion: faceEmotion,
      confidence: clampConfidence(faceConfidence),
    }),
    [faceConfidence, faceEmotion],
  );
  const fused = useMemo(
    () => fuseSignals(faceSignal, voiceSignal, textSignal),
    [faceSignal, textSignal, voiceSignal],
  );
  const top = fused[0];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Explainable fusion
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
          Facial + voice + text emotion fusion
        </h1>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          Combine a face scan result, a voice tone result, and a short text note into one weighted, explainable emotion estimate.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            Face signal
          </h2>
          <label className="block text-sm text-[var(--text-secondary)]">
            Detected emotion
            <select
              value={faceEmotion}
              onChange={(event) => setFaceEmotion(event.target.value as EmotionKey)}
              className="mt-2 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)]"
            >
              {emotionOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-[var(--text-secondary)]">
            Face confidence: {clampConfidence(faceConfidence)}%
            <input
              type="range"
              min={0}
              max={100}
              value={faceConfidence}
              onChange={(event) => setFaceConfidence(Number(event.target.value))}
              className="mt-3 w-full"
            />
          </label>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            Voice signal
          </h2>
          <label className="block text-sm text-[var(--text-secondary)]">
            Tone result
            <select
              value={voiceTone}
              onChange={(event) => setVoiceTone(event.target.value)}
              className="mt-2 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)]"
            >
              <option value="quiet">Low or quiet voice</option>
              <option value="steady">Steady voice</option>
              <option value="expressive">Expressive voice</option>
              <option value="activated">Activated voice</option>
            </select>
          </label>
          <label className="block text-sm text-[var(--text-secondary)]">
            Voice confidence: {clampConfidence(voiceConfidence)}%
            <input
              type="range"
              min={0}
              max={100}
              value={voiceConfidence}
              onChange={(event) => setVoiceConfidence(Number(event.target.value))}
              className="mt-3 w-full"
            />
          </label>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[var(--emotion-text,var(--text-primary))]">
            Text signal
          </h2>
          <label className="block text-sm text-[var(--text-secondary)]">
            Short note
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Example: I feel nervous and tired after school."
              rows={5}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-3 text-[var(--text-primary)]"
            />
          </label>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            Text signal: {emotionLabels[textSignal.emotion]} at {textSignal.confidence}% confidence
            {textSignal.matchedWords.length ? ` from: ${textSignal.matchedWords.join(", ")}` : ""}
          </p>
        </Card>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={() => setShowResult(true)} className="sm:flex-1">
          Fuse signals
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setText("");
            setShowResult(false);
          }}
          className="sm:flex-1"
        >
          Reset note
        </Button>
      </div>

      {showResult && top && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-[var(--emotion-accent,var(--accent-primary))]/15 p-3 text-[var(--emotion-accent,var(--accent-primary))]">
                  <Brain size={28} aria-hidden />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-[var(--emotion-text,var(--text-primary))]">
                    {emotionLabels[top.emotion]}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {getConfidenceBand(top.score)} across the available signals.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--emotion-text,var(--text-secondary))]">
                Fusion score {Math.round(top.score)}%
              </span>
            </div>

            <div className="space-y-3">
              {fused.map((item) => (
                <div key={item.emotion}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--text-secondary)]">{emotionLabels[item.emotion]}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">
                      {Math.round(item.score)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--emotion-accent,var(--accent-primary))]"
                      style={{ width: `${Math.min(100, item.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-[var(--emotion-accent,var(--accent-primary))]">
              <ShieldCheck size={28} aria-hidden />
              <h2 className="font-display text-xl font-bold">Why this result?</h2>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {top.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              Fusion weights: face 45%, voice 30%, text 25%. This is an explainable support tool, not a diagnosis or clinical risk score.
            </p>
          </Card>
        </section>
      )}
    </div>
  );
}
