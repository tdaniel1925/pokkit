/**
 * POKKIT Citizen Agent
 *
 * The core autonomous agent that drives citizen behavior.
 * Each citizen is an independent agent with:
 * - Personality (static)
 * - State (dynamic)
 * - Memory (persistent)
 * - Beliefs (evolving)
 */

import type {
  Citizen,
  CitizenDynamicState,
  CitizenPost,
  CitizenMemory,
  ConsentThresholds,
} from "@/types/citizen";
import type { WorldState } from "@/types/world";
import { v4 as uuid } from "uuid";
import {
  generateRandomAttributes,
  generateCitizenName,
  buildPersonalityPrompt,
} from "./personality";
import { buildMemoryContext, createMemory, createDivineMemory } from "./memory";
import { generateInitialBeliefs, buildBeliefContext } from "./beliefs";
import { checkCitizenContent } from "@/lib/guardrails";
import {
  generateDeepSeekResponse,
  generateGPTResponse,
  selectProvider,
} from "../providers";

/**
 * Generate a new citizen for a world
 */
export function generateCitizen(worldId: string, tick: number): Citizen {
  const attributes = generateRandomAttributes();

  // Initial dynamic state
  const state: CitizenDynamicState = {
    mood: 0.3 + Math.random() * 0.4, // Slightly positive to neutral
    stress: Math.random() * 0.3, // Low initial stress
    hope: 0.4 + Math.random() * 0.3, // Moderate hope
    trustInPeers: 0.4 + Math.random() * 0.2,
    trustInGod: attributes.authorityTrustBias * 0.3, // Influenced by authority bias
    cognitiveDissonance: Math.random() * 0.2, // Low initial dissonance
  };

  // Consent thresholds (influenced by personality)
  const consent: ConsentThresholds = {
    emotionalConsent: 0.5 + attributes.emotionalSensitivity * 0.3,
    relationalPacingLimit: attributes.personalityArchetype === "conformist" ? 0.7 : 0.5,
    authorityResistanceCurve:
      attributes.authorityTrustBias > 0
        ? 0.6 + attributes.authorityTrustBias * 0.2
        : 0.4 + Math.abs(attributes.authorityTrustBias) * 0.1,
  };

  // Generate initial beliefs
  const beliefs = generateInitialBeliefs(attributes, tick);

  return {
    id: uuid(),
    worldId,
    name: generateCitizenName(),
    attributes,
    state,
    consent,
    beliefs,
    createdAtTick: tick,
    lastActiveTick: tick,
  };
}

/**
 * Generate a population of citizens
 */
export function generatePopulation(
  worldId: string,
  size: number,
  tick: number
): Citizen[] {
  return Array.from({ length: size }, () => generateCitizen(worldId, tick));
}

/**
 * Build the full context prompt for a citizen
 */
export function buildCitizenContext(
  citizen: Citizen,
  memories: CitizenMemory[],
  world: WorldState,
  additionalContext?: string
): string {
  const personalityPrompt = buildPersonalityPrompt(citizen.attributes);
  const memoryContext = buildMemoryContext(memories);
  const beliefContext = buildBeliefContext(citizen.beliefs);

  // State description
  const stateDesc = describeState(citizen.state);

  return `${personalityPrompt}

NAME: ${citizen.name}

CURRENT STATE:
${stateDesc}

${memoryContext}

${beliefContext}

WORLD CONTEXT:
- World tick: ${world.tick}
- World status: ${world.status}
${additionalContext ? `\nSITUATION:\n${additionalContext}` : ""}`;
}

function describeState(state: CitizenDynamicState): string {
  const lines: string[] = [];

  // Mood
  if (state.mood > 0.5) lines.push("- Feeling positive and content");
  else if (state.mood > 0) lines.push("- Mood is neutral to slightly positive");
  else if (state.mood > -0.5) lines.push("- Feeling somewhat low");
  else lines.push("- Experiencing significant emotional distress");

  // Stress
  if (state.stress > 0.7) lines.push("- Very stressed and anxious");
  else if (state.stress > 0.4) lines.push("- Moderately stressed");
  else lines.push("- Relatively calm");

  // Hope
  if (state.hope > 0.7) lines.push("- Hopeful about the future");
  else if (state.hope > 0.3) lines.push("- Uncertain about what lies ahead");
  else lines.push("- Struggling to see hope");

  // Trust in God
  if (state.trustInGod > 0.5) lines.push("- Has faith in the divine");
  else if (state.trustInGod > 0) lines.push("- Cautiously open to divine presence");
  else if (state.trustInGod > -0.5) lines.push("- Skeptical of divine intentions");
  else lines.push("- Deeply distrustful or resentful of the divine");

  // Cognitive dissonance
  if (state.cognitiveDissonance > 0.6) {
    lines.push("- Experiencing significant internal conflict about beliefs");
  }

  return lines.join("\n");
}

/**
 * Generate a citizen's autonomous action/thought
 */
export async function generateCitizenAction(
  citizen: Citizen,
  memories: CitizenMemory[],
  world: WorldState,
  situation?: string
): Promise<CitizenPost | null> {
  const context = buildCitizenContext(citizen, memories, world, situation);

  const prompt = `Based on your personality and current state, generate a single authentic thought, statement, or action.

This could be:
- A private thought or reflection
- A public statement to others
- A prayer or question to the divine
- An observation about the world

Keep it brief (1-3 sentences) and genuine to your character.

Respond with ONLY the thought/statement, no explanations.`;

  try {
    // Use DeepSeek for bulk generation, fallback to GPT
    const provider = selectProvider("deepseek", ["openai"]);
    let response: string;

    if (provider === "deepseek") {
      response = await generateDeepSeekResponse(prompt, {
        systemPrompt: context,
        temperature: 0.8,
        maxTokens: 150,
      });
    } else if (provider === "openai") {
      response = await generateGPTResponse(prompt, {
        systemPrompt: context,
        temperature: 0.8,
        maxTokens: 150,
      });
    } else {
      // No provider available
      return null;
    }

    // Check through guardrails
    const guardrailResult = await checkCitizenContent(response, citizen.id, world.id);

    if (!guardrailResult.passed) {
      // Content blocked - use modified content or skip
      if (guardrailResult.modifiedContent) {
        response = guardrailResult.modifiedContent;
      } else {
        return null;
      }
    }

    // Determine post type based on content
    const type = determinePostType(response, citizen.state);

    return {
      id: uuid(),
      citizenId: citizen.id,
      worldId: world.id,
      content: response,
      type,
      visibility: type === "prayer" ? "divine_only" : "public",
      tick: world.tick,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error(`Failed to generate action for citizen ${citizen.id}:`, error);
    return null;
  }
}

function determinePostType(
  content: string,
  state: CitizenDynamicState
): CitizenPost["type"] {
  const lower = content.toLowerCase();

  if (lower.includes("pray") || lower.includes("god") || lower.includes("divine")) {
    return "prayer";
  }
  if (lower.includes("?")) {
    return "question";
  }
  if (lower.includes("i think") || lower.includes("i feel") || lower.includes("i wonder")) {
    return "thought";
  }

  // Default based on mood
  return state.mood > 0.3 ? "statement" : "thought";
}

/**
 * Update citizen state based on events
 */
export function updateCitizenState(
  state: CitizenDynamicState,
  event: {
    type: "positive" | "negative" | "neutral" | "divine";
    intensity: number;
  }
): CitizenDynamicState {
  const { type, intensity } = event;
  const newState = { ...state };

  switch (type) {
    case "positive":
      newState.mood = Math.min(1, state.mood + intensity * 0.2);
      newState.hope = Math.min(1, state.hope + intensity * 0.1);
      newState.stress = Math.max(0, state.stress - intensity * 0.1);
      break;

    case "negative":
      newState.mood = Math.max(-1, state.mood - intensity * 0.3);
      newState.hope = Math.max(0, state.hope - intensity * 0.15);
      newState.stress = Math.min(1, state.stress + intensity * 0.2);
      break;

    case "divine":
      // Divine events create significant impact
      newState.cognitiveDissonance = Math.min(
        1,
        state.cognitiveDissonance + intensity * 0.1
      );
      // Trust change depends on current trust
      if (state.trustInGod > 0) {
        newState.trustInGod = Math.min(1, state.trustInGod + intensity * 0.1);
      } else {
        // Negative trust becomes more complex
        newState.cognitiveDissonance = Math.min(
          1,
          newState.cognitiveDissonance + intensity * 0.1
        );
      }
      break;

    case "neutral":
      // Slight regression toward baseline
      newState.mood = state.mood * 0.95;
      newState.stress = state.stress * 0.9;
      break;
  }

  return newState;
}

export { buildPersonalityPrompt, generateCitizenName } from "./personality";
export { createMemory, createDivineMemory, buildMemoryContext } from "./memory";
export { generateInitialBeliefs, buildBeliefContext } from "./beliefs";
