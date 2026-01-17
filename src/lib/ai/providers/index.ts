/**
 * AI Provider Index
 *
 * Unified interface for all AI providers.
 * Provider selection is based on use case:
 *
 * - Anthropic Claude: Safety-critical, ethical decisions
 * - OpenAI GPT: Creative content, conversations
 * - DeepSeek: Bulk processing, background tasks
 */

export {
  anthropic,
  ANTHROPIC_MODELS,
  generateClaudeResponse,
  generateSafeResponse,
  type AnthropicModel,
  type AnthropicChatOptions,
} from "./anthropic";

export {
  openai,
  OPENAI_MODELS,
  generateGPTResponse,
  generateCreativeContent,
  type OpenAIModel,
  type OpenAIChatOptions,
} from "./openai";

export {
  deepseek,
  DEEPSEEK_MODELS,
  generateDeepSeekResponse,
  generateBulkCitizenThoughts,
  type DeepSeekModel,
  type DeepSeekChatOptions,
} from "./deepseek";

// Provider availability check
export function getAvailableProviders(): string[] {
  const providers: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.DEEPSEEK_API_KEY) providers.push("deepseek");
  return providers;
}

// Fallback provider selection
export type AIProvider = "anthropic" | "openai" | "deepseek";

export function selectProvider(
  preferred: AIProvider,
  fallbacks: AIProvider[] = []
): AIProvider | null {
  const available = getAvailableProviders();

  if (available.includes(preferred)) {
    return preferred;
  }

  for (const fallback of fallbacks) {
    if (available.includes(fallback)) {
      return fallback;
    }
  }

  return available[0] as AIProvider | null;
}
