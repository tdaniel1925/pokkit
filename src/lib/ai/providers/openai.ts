/**
 * OpenAI GPT Client
 *
 * Used for: General citizen dialogue, social interactions
 * Best for: Creative content, conversation, story generation
 */

import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set - OpenAI provider will not work");
}

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const OPENAI_MODELS = {
  GPT4_TURBO: "gpt-4-turbo-preview",
  GPT4: "gpt-4",
  GPT35_TURBO: "gpt-3.5-turbo",
} as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

export interface OpenAIChatOptions {
  model?: OpenAIModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Generate a chat completion using GPT
 */
export async function generateGPTResponse(
  prompt: string,
  options: OpenAIChatOptions = {}
): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI client not initialized - check OPENAI_API_KEY");
  }

  const {
    model = OPENAI_MODELS.GPT35_TURBO,
    maxTokens = 1024,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content;
}

/**
 * Generate creative citizen content
 */
export async function generateCreativeContent(
  prompt: string,
  personality: string
): Promise<string> {
  const systemPrompt = `You are roleplaying as a citizen in a simulated world.
Your personality: ${personality}

Guidelines:
- Stay in character
- Express genuine emotions and thoughts
- Be authentic to your personality
- Keep responses concise (1-3 sentences for posts, longer for dialogues)`;

  return generateGPTResponse(prompt, {
    model: OPENAI_MODELS.GPT35_TURBO,
    systemPrompt,
    temperature: 0.8, // Higher for creativity
  });
}
