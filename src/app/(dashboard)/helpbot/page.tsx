"use client";

import { useMemo, useRef, useState } from "react";
import { ChatCircleText, PaperPlaneRight, ShieldCheck } from "@phosphor-icons/react";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";

type HelpbotMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  "I feel overwhelmed by noise.",
  "I am angry and need a calm step.",
  "I do not know what emotion this is.",
  "Help me explain my feeling to a caregiver.",
];

const initialMessages: HelpbotMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I am EmoSense Helpbot. Tell me what happened or how your body feels, and I can help name the emotion and choose one small next step.",
  },
];

function makeMessage(role: HelpbotMessage["role"], content: string): HelpbotMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

export default function HelpbotPage() {
  const [messages, setMessages] = useState<HelpbotMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const conversationForApi = useMemo(
    () =>
      messages
        .filter((message) => message.id !== "welcome")
        .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  async function sendMessage(messageText = input) {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    const userMessage = makeMessage("user", trimmed);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/helpbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          messages: conversationForApi,
        }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Helpbot could not reply.");
      }
      setMessages((current) => [
        ...current,
        makeMessage(
          "assistant",
          data.reply ??
            "I can help with one small next step. Try naming the feeling, then choose quiet, water, breathing, or asking for help.",
        ),
      ]);
    } catch {
      setError("Helpbot could not reply. Try again in a moment.");
      setMessages((current) => [
        ...current,
        makeMessage(
          "assistant",
          "I could not answer right now. Try one small calming step, then send your message again.",
        ),
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Support chat
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-[var(--emotion-text,var(--text-primary))] md:text-5xl">
          Helpbot
        </h1>
        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          Ask for help naming a feeling, choosing a coping step, or explaining a situation to a caregiver.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="flex min-h-[620px] flex-col p-0">
          <div className="border-b border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[var(--emotion-accent,var(--accent-primary))]/15 p-3 text-[var(--emotion-accent,var(--accent-primary))]">
                <ChatCircleText size={28} aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[var(--emotion-text,var(--text-primary))]">
                  EmoSense Helpbot
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Plain-language emotional support
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-[var(--emotion-accent,var(--accent-primary))] text-white"
                      : "border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  Helpbot is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] p-5">
            {error && (
              <p className="mb-3 rounded-lg border border-[var(--accent-alert)]/40 bg-[var(--accent-alert)]/10 p-3 text-sm text-[var(--accent-alert)]">
                {error}
              </p>
            )}
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <label className="sr-only" htmlFor="helpbot-message">
                Message Helpbot
              </label>
              <textarea
                ref={inputRef}
                id="helpbot-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type what happened or how you feel..."
                rows={2}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--emotion-accent,var(--accent-primary))]"
              />
              <Button type="submit" disabled={!input.trim() || loading} loading={loading} className="sm:w-[120px]">
                <span className="inline-flex items-center gap-2">
                  Send
                  <PaperPlaneRight size={18} aria-hidden />
                </span>
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[var(--emotion-text,var(--text-primary))]">
              Quick starts
            </h2>
            <div className="space-y-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-[var(--emotion-accent,var(--accent-primary))]">
              <ShieldCheck size={28} aria-hidden />
              <h2 className="font-display text-xl font-bold">Safety</h2>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li>Helpbot is supportive, not a therapist or emergency service.</li>
              <li>It should not diagnose, prescribe, or decide risk.</li>
              <li>If someone may be unsafe, contact a trusted adult, caregiver, local helpline, or emergency services.</li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}
