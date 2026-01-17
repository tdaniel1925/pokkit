/**
 * Anthropic Claude Client
 *
 * Used for: Safety middleware, key interactions, complex reasoning
 * Best for: Safety-critical content, nuanced ethical decisions
 */

import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY not set - Anthropic provider will not work");
}

export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const ANTHROPIC_MODELS = {
  CLAUDE_3_OPUS: "claude-3-opus-20240229",
  CLAUDE_3_SONNET: "claude-3-5-sonnet-20241022",
  CLAUDE_3_HAIKU: "claude-3-5-haiku-20241022",
} as const;

export type AnthropicModel = (typeof ANTHROPIC_MODELS)[keyof typeof ANTHROPIC_MODELS];

export interface AnthropicChatOptions {
  model?: AnthropicModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Generate a chat completion using Claude
 */
export async function generateClaudeResponse(
  prompt: string,
  options: AnthropicChatOptions = {}
): Promise<string> {
  if (!anthropic) {
    throw new Error("Anthropic client not initialized - check ANTHROPIC_API_KEY");
  }

  const {
    model = ANTHROPIC_MODELS.CLAUDE_3_HAIKU,
    maxTokens = 1024,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return content.text;
}

/**
 * Safety-focused completion (uses Claude for best safety alignment)
 */
export async function generateSafeResponse(
  prompt: string,
  context: string
): Promise<string> {
  const systemPrompt = `You are a safety-conscious AI assistant helping moderate content in a world simulation.
Your role is to ensure content is safe, ethical, and does not encourage harm.

Context: ${context}

Guidelines:
- Never encourage self-harm or violence
- Validate emotions without validating harmful intentions
- Suggest constructive alternatives
- Maintain a caring, supportive tone`;

  return generateClaudeResponse(prompt, {
    model: ANTHROPIC_MODELS.CLAUDE_3_HAIKU,
    systemPrompt,
    temperature: 0.5, // Lower temperature for safety
  });
}
