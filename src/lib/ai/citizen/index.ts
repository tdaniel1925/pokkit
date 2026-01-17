/**
 * POKKIT Citizen Agent System
 *
 * Exports all citizen-related functionality:
 * - Agent generation and behavior
 * - Personality system
 * - Memory system
 * - Belief system
 */

// Main agent functions
export {
  generateCitizen,
  generatePopulation,
  buildCitizenContext,
  generateCitizenAction,
  updateCitizenState,
} from "./agent";

// Personality
export {
  generateRandomAttributes,
  generateCitizenName,
  buildPersonalityPrompt,
  ARCHETYPE_DESCRIPTIONS,
} from "./personality";

// Memory
export {
  createMemory,
  createDivineMemory,
  processMemoryDecay,
  shouldConvertToLongTerm,
  convertToLongTerm,
  pruneMemories,
  extractMemoryPatterns,
  buildMemoryContext,
} from "./memory";

// Beliefs
export {
  generateInitialBeliefs,
  createBelief,
  updateBelief,
  processDivineImpactOnBeliefs,
  buildBeliefContext,
  BELIEF_TOPICS,
  type BeliefTopic,
} from "./beliefs";
