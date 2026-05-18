import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function runExplainEmotion(
  emotion: string,
  confidence: number,
): Promise<string> {
  const client = getClient();
  const userPrompt = `The person's face shows ${emotion} (${Math.round(
    confidence,
  )}% confidence). Explain what this emotion means and what might cause it.`;

  if (!client) {
    return (
      "The scan points to " +
      emotion +
      ". Faces can look many ways for many reasons. " +
      "If you feel unsure, take a break and check in with someone you trust."
    );
  }

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 220,
    system:
      "You explain emotions to autistic individuals. Use very simple words (max grade 4 reading level). No idioms, no sarcasm, no ambiguous phrases. Be warm, calm, and specific. Never say 'normal' or 'weird'. Always respond in exactly 3 short sentences.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text.trim();
  }
  return (
    "This feeling is called " +
    emotion +
    ". It is one way a face can look. " +
    "Your face and your feelings belong to you."
  );
}
