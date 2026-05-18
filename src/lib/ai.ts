import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function textFromMessage(content: Anthropic.Messages.Message["content"]): string {
  const block = content[0];
  if (block?.type === "text") {
    return block.text.trim();
  }
  return "";
}

export async function explainEmotion(
  emotion: string,
  confidence: number,
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    system: `You explain emotions to autistic individuals.
      Simple words, max grade 4 reading level.
      No idioms, no sarcasm, no ambiguous phrases.
      Warm, calm, specific. Never say normal or weird.
      Exactly 3 short sentences.`,
    messages: [
      {
        role: "user",
        content: `Face shows ${emotion} at ${confidence}%.
           What is this emotion and what causes it?`,
      },
    ],
  });
  return textFromMessage(message.content);
}

export async function generateWeeklyInsights(logs: object[]): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: `Help caregivers understand behaviour patterns.
      Plain English, kind and factual.
      3-5 bullet points each starting with an emoji.`,
    messages: [
      {
        role: "user",
        content: `This week's logs: ${JSON.stringify(logs)}`,
      },
    ],
  });
  return textFromMessage(message.content);
}
