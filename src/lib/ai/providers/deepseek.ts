/**
 * DeepSeek Client
 *
 * Used for: Bulk citizen processing, background thoughts
 * Best for: Cost-effective high-volume generation
 *
 * DeepSeek uses OpenAI-compatible API
 */

import OpenAI from "openai";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

if (!process.env.DEEPSEEK_API_KEY) {
  console.warn("DEEPSEEK_API_KEY not set - DeepSeek provider will not work");
}

export const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_BASE_URL,
    })
  : null;

export const DEEPSEEK_MODELS = {
  DEEPSEEK_CHAT: "deepseek-chat",
  DEEPSEEK_CODER: "deepseek-coder",
} as const;

export type DeepSeekModel = (typeof DEEPSEEK_MODELS)[keyof typeof DEEPSEEK_MODELS];

export interface DeepSeekChatOptions {
  model?: DeepSeekModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Generate a chat completion using DeepSeek
 */
export async function generateDeepSeekResponse(
  prompt: string,
  options: DeepSeekChatOptions = {}
): Promise<string> {
  if (!deepseek) {
    throw new Error("DeepSeek client not initialized - check DEEPSEEK_API_KEY");
  }

  const {
    model = DEEPSEEK_MODELS.DEEPSEEK_CHAT,
    maxTokens = 512,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await deepseek.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from DeepSeek");
  }

  return content;
}

/**
 * Batch generate content for multiple citizens (cost-effective)
 */
export async function generateBulkCitizenThoughts(
  citizens: Array<{ id: string; name: string; personality: string; context: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in parallel for efficiency
  const promises = citizens.map(async (citizen) => {
    try {
      const thought = await generateDeepSeekResponse(
        `Generate a brief thought or observation for ${citizen.name}. Context: ${citizen.context}`,
        {
          systemPrompt: `You are ${citizen.name}, a citizen with this personality: ${citizen.personality}. Generate a single, authentic thought in 1-2 sentences.`,
          temperature: 0.8,
          maxTokens: 100,
        }
      );
      results.set(citizen.id, thought);
    } catch (error) {
      console.error(`Failed to generate thought for ${citizen.id}:`, error);
      results.set(citizen.id, ""); // Empty on failure
    }
  });

  await Promise.all(promises);
  return results;
}
