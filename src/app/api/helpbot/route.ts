import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { askClaude, isClaudeConfigured } from "@/src/lib/claude";
import { answerHelpbot } from "@/src/lib/helpbotKnowledge";

type ChatMessage = Anthropic.MessageParam & { content: string };

const MAX_HISTORY = 8;
const crisisWords = [
  "suicide",
  "kill myself",
  "hurt myself",
  "self harm",
  "self-harm",
  "end my life",
  "want to die",
  "kill me",
  "don't want to live",
  "dont want to live",
  "better off dead",
];

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 1200) : "";
}

function parseMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const role = record.role === "assistant" ? "assistant" : "user";
      const content = cleanText(record.content);
      if (!content) return null;
      return { role, content };
    })
    .filter((item): item is ChatMessage => item != null)
    .slice(-MAX_HISTORY);
}

function containsCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return crisisWords.some((word) => lower.includes(word));
}

const CRISIS_REPLY =
  "I am really sorry you are feeling this way. You deserve help right now. Please tell a trusted adult or caregiver immediately. If you might hurt yourself, call your local emergency number. In India you can call Tele-MANAS on 14416 (24/7). The Settings page lists more helplines.";

const SYSTEM_PROMPT = `You are EmoSense Helpbot, a supportive assistant for autistic people, their caregivers and therapists.

Answer the question the person actually asked:
- "What is / what does X mean" -> a short, literal definition and one everyday example.
- "How does X feel in the body" -> concrete body signs.
- Social questions (sarcasm, teasing, tone of voice, body language, friendships, conversations) -> clear, specific signs or rules of thumb, plus a polite way to check or ask.
- Body symptoms (racing heart, fast breathing, shaking, stomach ache) -> what the body is doing, then 2-4 practical calming steps.
- "How do I cope / calm down / handle X" -> 2-4 concrete steps.
- When someone describes a situation or feeling -> name the possible feeling, say why it might happen, and offer one small next step.

Style: plain, literal language with no idioms or sarcasm. Short sentences. Warm and non-judgmental. Use a short numbered list for steps, one item per line. Plain text only: no markdown headings, bold or tables. Keep the whole reply under about 120 words.
Safety: do not diagnose or claim certainty about another person's feelings. Do not give medical instructions; suggest a trusted adult or doctor for health worries. If anyone may be unsafe, tell them to contact a trusted person or emergency services right away.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: unknown; messages?: unknown };
    const message = cleanText(body.message);
    const history = parseMessages(body.messages);

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (containsCrisisLanguage(message)) {
      return NextResponse.json({ reply: CRISIS_REPLY, source: "safety" });
    }

    const local = answerHelpbot(message);
    if (!isClaudeConfigured()) {
      return NextResponse.json({ reply: local.reply, source: "local", topic: local.topic });
    }

    // The API requires the first turn to be from the user.
    while (history.length && history[0].role !== "user") history.shift();

    // Give Claude the dictionary-based answer as grounding, but let it
    // write its own reply to the exact question.
    const grounding =
      local.topic === "unknown"
        ? ""
        : `\n\nReference notes from the EmoSense emotion dictionary (use if relevant, rephrase freely):\n${local.reply}`;

    const reply = await askClaude({
      system: SYSTEM_PROMPT + grounding,
      messages: [...history, { role: "user", content: message }],
    });

    return NextResponse.json({
      reply: reply ?? local.reply,
      source: reply ? "anthropic" : "local",
      topic: local.topic,
    });
  } catch {
    return NextResponse.json(
      {
        reply: "I could not answer right now. Try one small calming step, then send your message again.",
        source: "error",
      },
      { status: 200 },
    );
  }
}
