/**
 * POKKIT Citizen Memory System
 *
 * Based on PRD Section 5.3 - Memory System
 *
 * Memory types:
 * - Short-term: Decays over time
 * - Long-term: Emotion-weighted, persistent
 * - Divine Interaction: NEVER erasable
 *
 * "Citizens remember patterns, not just events."
 */

import type { CitizenMemory } from "@/types/citizen";
import { v4 as uuid } from "uuid";

// Memory decay rates (per tick)
const DECAY_RATES = {
  short_term: 0.1, // Fast decay
  long_term: 0.001, // Very slow decay
  divine_interaction: 0, // Never decays
};

// Minimum importance to convert short-term to long-term
const LONG_TERM_THRESHOLD = 0.6;

// Maximum memories per citizen (to prevent bloat)
const MAX_SHORT_TERM_MEMORIES = 20;
const MAX_LONG_TERM_MEMORIES = 50;

/**
 * Create a new memory
 */
export function createMemory(
  citizenId: string,
  content: string,
  tick: number,
  options: {
    type?: CitizenMemory["type"];
    emotionalWeight?: number;
    importance?: number;
    isDivine?: boolean;
  } = {}
): CitizenMemory {
  const {
    type = "short_term",
    emotionalWeight = 0,
    importance = 0.5,
    isDivine = false,
  } = options;

  // Divine interactions are ALWAYS divine_interaction type
  const actualType = isDivine ? "divine_interaction" : type;

  return {
    id: uuid(),
    citizenId,
    type: actualType,
    content,
    emotionalWeight,
    importance,
    tick,
    decayRate: DECAY_RATES[actualType],
    isDivine,
  };
}

/**
 * Create a divine interaction memory (non-erasable)
 */
export function createDivineMemory(
  citizenId: string,
  content: string,
  tick: number,
  emotionalWeight: number
): CitizenMemory {
  return createMemory(citizenId, content, tick, {
    type: "divine_interaction",
    emotionalWeight,
    importance: 1, // Divine memories are always max importance
    isDivine: true,
  });
}

/**
 * Process memory decay for a citizen
 * Returns memories that should be kept
 */
export function processMemoryDecay(
  memories: CitizenMemory[],
  currentTick: number
): CitizenMemory[] {
  return memories
    .map((memory) => {
      // Divine memories never decay
      if (memory.isDivine) {
        return memory;
      }

      // Calculate decay based on time passed
      const ticksPassed = currentTick - memory.tick;
      const decayAmount = memory.decayRate * ticksPassed;
      const newImportance = Math.max(0, memory.importance - decayAmount);

      return {
        ...memory,
        importance: newImportance,
      };
    })
    .filter((memory) => {
      // Keep divine memories always
      if (memory.isDivine) return true;
      // Keep if still important enough
      return memory.importance > 0.1;
    });
}

/**
 * Check if a short-term memory should become long-term
 */
export function shouldConvertToLongTerm(memory: CitizenMemory): boolean {
  if (memory.type !== "short_term") return false;

  // High importance
  if (memory.importance >= LONG_TERM_THRESHOLD) return true;

  // Strong emotional weight (positive or negative)
  if (Math.abs(memory.emotionalWeight) >= 0.7) return true;

  return false;
}

/**
 * Convert a short-term memory to long-term
 */
export function convertToLongTerm(memory: CitizenMemory): CitizenMemory {
  return {
    ...memory,
    type: "long_term",
    decayRate: DECAY_RATES.long_term,
  };
}

/**
 * Prune memories to stay within limits
 * Keeps most important memories, always keeps divine
 */
export function pruneMemories(memories: CitizenMemory[]): CitizenMemory[] {
  const divine = memories.filter((m) => m.isDivine);
  const longTerm = memories.filter((m) => m.type === "long_term" && !m.isDivine);
  const shortTerm = memories.filter((m) => m.type === "short_term");

  // Sort by importance (descending)
  longTerm.sort((a, b) => b.importance - a.importance);
  shortTerm.sort((a, b) => b.importance - a.importance);

  // Keep within limits
  const keptLongTerm = longTerm.slice(0, MAX_LONG_TERM_MEMORIES);
  const keptShortTerm = shortTerm.slice(0, MAX_SHORT_TERM_MEMORIES);

  return [...divine, ...keptLongTerm, ...keptShortTerm];
}

/**
 * Extract patterns from memories (for AI context)
 */
export function extractMemoryPatterns(memories: CitizenMemory[]): string[] {
  const patterns: string[] = [];

  // Divine interaction patterns
  const divineMemories = memories.filter((m) => m.isDivine);
  if (divineMemories.length > 0) {
    const avgEmotional =
      divineMemories.reduce((sum, m) => sum + m.emotionalWeight, 0) / divineMemories.length;
    if (avgEmotional > 0.3) {
      patterns.push("Generally positive experiences with the divine");
    } else if (avgEmotional < -0.3) {
      patterns.push("Generally negative or troubling divine encounters");
    }
    patterns.push(`Has had ${divineMemories.length} divine interaction(s)`);
  }

  // Emotional patterns
  const emotionalMemories = memories.filter((m) => Math.abs(m.emotionalWeight) > 0.5);
  const positive = emotionalMemories.filter((m) => m.emotionalWeight > 0).length;
  const negative = emotionalMemories.filter((m) => m.emotionalWeight < 0).length;

  if (positive > negative * 2) {
    patterns.push("Recent life has been mostly positive");
  } else if (negative > positive * 2) {
    patterns.push("Has experienced significant hardship recently");
  }

  return patterns;
}

/**
 * Build memory context for AI prompt
 */
export function buildMemoryContext(memories: CitizenMemory[]): string {
  const patterns = extractMemoryPatterns(memories);

  // Get most important recent memories
  const recentImportant = memories
    .filter((m) => m.importance > 0.5)
    .sort((a, b) => b.tick - a.tick)
    .slice(0, 5);

  let context = "MEMORY PATTERNS:\n";
  context += patterns.map((p) => `- ${p}`).join("\n");

  if (recentImportant.length > 0) {
    context += "\n\nRECENT SIGNIFICANT MEMORIES:\n";
    context += recentImportant
      .map(
        (m) =>
          `- ${m.content} (${m.isDivine ? "DIVINE" : m.type}, emotional: ${m.emotionalWeight.toFixed(1)})`
      )
      .join("\n");
  }

  return context;
}
