import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MODEL = "claude-sonnet-4-20250514";
const MAX_HISTORY = 8;
const crisisWords = [
  "suicide",
  "kill myself",
  "hurt myself",
  "self harm",
  "self-harm",
  "end my life",
  "want to die",
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

function fallbackReply(message: string): string {
  const lower = message.toLowerCase();
  if (containsCrisisLanguage(message)) {
    return (
      "I am really sorry you are feeling this. Please tell a trusted adult or caregiver now, and contact local emergency services if you might hurt yourself. You deserve help right away."
    );
  }
  if (lower.includes("angry") || lower.includes("mad") || lower.includes("frustrated")) {
    return "It sounds like anger or frustration may be high. Try one small step: move away from noise, unclench your hands, and take 3 slow breaths. Then write or say what felt unfair.";
  }
  if (lower.includes("scared") || lower.includes("anxious") || lower.includes("worried")) {
    return "That sounds scary or uncertain. Look for 3 things you can see, put both feet on the floor, and ask a trusted person one clear question about what happens next.";
  }
  if (lower.includes("sad") || lower.includes("lonely") || lower.includes("tired")) {
    return "That sounds heavy. You can try a low-energy support step: drink water, sit somewhere comfortable, and send one short message to someone safe.";
  }
  if (lower.includes("sensory") || lower.includes("noise") || lower.includes("loud")) {
    return "A sensory break may help. Lower the sound if you can, use headphones or a quiet corner, and give your body a few minutes before making a decision.";
  }
  return "I can help you name the feeling and choose one next step. Try this: say what happened, pick one feeling word, then choose one support action like water, quiet time, breathing, or asking for help.";
}

function textFromMessage(content: Anthropic.Messages.Message["content"]): string {
  const block = content[0];
  if (block?.type === "text") return block.text.trim();
  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: unknown; messages?: unknown };
    const message = cleanText(body.message);
    const history = parseMessages(body.messages);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json({ reply: fallbackReply(message), source: "fallback" });
    }

    if (containsCrisisLanguage(message)) {
      return NextResponse.json({ reply: fallbackReply(message), source: "safety" });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 260,
      system:
        "You are EmoSense Helpbot for autistic users, caregivers, and therapists. Use plain, concrete language. Keep replies under 5 short sentences. Be warm, non-clinical, non-judgmental, and sensory-aware. Do not diagnose, do not claim certainty, and do not provide medical or emergency instructions beyond telling the user to contact trusted people or emergency services if safety is at risk. Prefer one feeling label, one possible reason, and one small next step.",
      messages: [
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        { role: "user" as const, content: message },
      ],
    });

    return NextResponse.json({
      reply: textFromMessage(response.content) || fallbackReply(message),
      source: "anthropic",
    });
  } catch {
    return NextResponse.json(
      { reply: "I could not answer right now. Try one small calming step, then send your message again.", source: "error" },
      { status: 200 },
    );
  }
}
