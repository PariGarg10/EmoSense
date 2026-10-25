import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;

/** Returns a shared client, or null when no API key is configured. */
export function getClaudeClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;
  client ??= new Anthropic();
  return client;
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

type AskOptions = {
  system: string;
  messages: Anthropic.MessageParam[];
  /** Upper bound on output; thinking counts toward it, so keep headroom. */
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  timeoutMs?: number;
};

/**
 * Single-turn text request. Returns null when Claude is not configured,
 * declines, or errors, so callers can fall back to local guidance.
 */
export async function askClaude({
  system,
  messages,
  maxTokens = 2000,
  effort = "low",
  timeoutMs = 30_000,
}: AskOptions): Promise<string | null> {
  const anthropic = getClaudeClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        output_config: { effort },
        system,
        messages,
      },
      { timeout: timeoutMs, maxRetries: 1 },
    );

    if (response.stop_reason === "refusal") return null;

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return text || null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`[EmoSense] Claude API error ${error.status}: ${error.message}`);
    } else {
      console.error("[EmoSense] Claude request failed", error);
    }
    return null;
  }
}
