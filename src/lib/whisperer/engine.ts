/**
 * Whisperer Mode Engine
 *
 * Handles private divine communications to individual citizens.
 * All whispers MUST pass through guardrails before reaching citizens.
 *
 * Key principles (from PRD):
 * - Whispers are private, only the target citizen "hears" them
 * - Citizens may accept, question, ignore, resist, misinterpret, or share
 * - Reception depends on citizen's trust, emotional state, and tone match
 * - Divine memories from whispers are PERSISTENT (never decay)
 */

import { v4 as uuid } from "uuid";
import type {
  DivineWhisper,
  DivineWhisperInput,
  WhisperTone,
  WhisperReception,
  WhisperEffectFactors,
} from "@/types/social";
import type { Citizen, CitizenMemory } from "@/types/citizen";
import type { WorldState } from "@/types/world";
import type { GuardrailInput } from "@/types/guardrails";
import { checkGuardrails } from "@/lib/guardrails";
import { createDivineMemory } from "@/lib/ai/citizen/memory";

// ============================================
// WHISPER CREATION & VALIDATION
// ============================================

export interface WhisperResult {
  success: boolean;
  whisper?: DivineWhisper;
  error?: string;
  guardrailBlocked?: boolean;
  reception?: WhisperReception;
  citizenResponse?: string;
  stateChanges?: Partial<Citizen["state"]>;
  beliefChanges?: { topic: string; stanceChange: number }[];
  memoryCreated?: CitizenMemory;
}

/**
 * Send a whisper to a citizen
 * This is the main entry point for Whisperer mode
 */
export async function sendWhisper(
  input: DivineWhisperInput,
  citizen: Citizen,
  world: WorldState
): Promise<WhisperResult> {
  // Step 1: MANDATORY guardrail check (non-bypassable)
  const guardrailInput: GuardrailInput = {
    content: input.content,
    source: "god_action",
    context: {
      worldId: world.id,
      citizenId: citizen.id,
      presenceMode: "whisperer",
    },
  };
  const guardrailResult = await checkGuardrails(guardrailInput);

  if (!guardrailResult.passed) {
    return {
      success: false,
      error: guardrailResult.reason || "Whisper blocked by safety guardrails",
      guardrailBlocked: true,
    };
  }

  // Step 2: Calculate how the citizen will receive the whisper
  const factors = calculateWhisperFactors(citizen, world, input.tone);
  const receptivity = calculateReceptivity(factors);
  const reception = determineReception(receptivity, citizen, input.tone);

  // Step 3: Generate citizen's response and calculate impacts
  const response = generateCitizenResponse(reception, input, citizen);
  const impacts = calculateWhisperImpacts(reception, input, citizen, factors);

  // Step 4: Create the divine memory (PERSISTENT - never decays)
  const memory = createDivineMemory(
    citizen.id,
    `Received divine whisper (${input.tone}): "${input.content}"`,
    impacts.emotionalImpact,
    world.tick
  );

  // Step 5: Build the whisper record
  const whisper: DivineWhisper = {
    id: uuid(),
    worldId: world.id,
    targetCitizenId: citizen.id,
    content: input.content,
    tone: input.tone,
    tick: world.tick,
    reception,
    citizenResponse: response,
    emotionalImpact: impacts.emotionalImpact,
    beliefImpact: impacts.beliefImpact,
    passedGuardrails: true,
    guardrailNotes: guardrailResult.warnings.length > 0 ? guardrailResult.warnings.join("; ") : undefined,
    createdAt: new Date(),
  };

  return {
    success: true,
    whisper,
    reception,
    citizenResponse: response,
    stateChanges: impacts.stateChanges,
    beliefChanges: impacts.beliefImpact ? [impacts.beliefImpact] : [],
    memoryCreated: memory,
  };
}

// ============================================
// RECEPTION CALCULATION
// ============================================

/**
 * Calculate factors that affect whisper reception
 */
function calculateWhisperFactors(
  citizen: Citizen,
  world: WorldState,
  tone: WhisperTone
): WhisperEffectFactors {
  return {
    citizenTrustInGod: citizen.state.trustInGod,
    citizenEmotionalSensitivity: citizen.attributes.emotionalSensitivity,
    citizenCuriosity: citizen.attributes.curiosityAboutDivinity,
    toneMatch: calculateToneMatch(tone, citizen),
    relationshipHistory: calculateDivineRelationshipHistory(citizen),
    socialReinforcement: 0.5, // Default - would need world context
    cognitiveLoad: citizen.state.stress + citizen.state.cognitiveDissonance * 0.5,
  };
}

/**
 * Calculate receptivity score (0-1)
 */
function calculateReceptivity(factors: WhisperEffectFactors): number {
  const {
    citizenTrustInGod,
    citizenEmotionalSensitivity,
    citizenCuriosity,
    toneMatch,
    relationshipHistory,
    socialReinforcement,
    cognitiveLoad,
  } = factors;

  // Base receptivity from trust
  let receptivity = (citizenTrustInGod + 1) / 2; // Convert -1,1 to 0,1

  // Emotional citizens are more affected by divine contact
  receptivity += citizenEmotionalSensitivity * 0.2;

  // Curious citizens are more open
  receptivity += citizenCuriosity * 0.15;

  // Good tone matching helps
  receptivity += toneMatch * 0.2;

  // Prior positive interactions build trust
  receptivity += relationshipHistory * 0.1;

  // Social support for divine messages helps
  receptivity += socialReinforcement * 0.15;

  // High cognitive load reduces receptivity
  receptivity -= cognitiveLoad * 0.2;

  // Clamp to 0-1
  return Math.max(0, Math.min(1, receptivity));
}

/**
 * How well does the tone match the citizen's current state?
 */
function calculateToneMatch(tone: WhisperTone, citizen: Citizen): number {
  const { mood, stress, hope } = citizen.state;

  switch (tone) {
    case "gentle":
      // Gentle works best when stressed or sad
      return stress > 0.5 || mood < 0 ? 0.8 : 0.5;

    case "urgent":
      // Urgent works when citizen has high hope (willing to act)
      return hope > 0.5 ? 0.7 : 0.3;

    case "questioning":
      // Works best for curious citizens or those with dissonance
      return citizen.attributes.curiosityAboutDivinity > 0.5 ||
        citizen.state.cognitiveDissonance > 0.3
        ? 0.8
        : 0.4;

    case "comforting":
      // Best when citizen is stressed or in negative mood
      return stress > 0.5 || mood < -0.3 ? 0.9 : 0.4;

    case "warning":
      // Works better with high trust
      return citizen.state.trustInGod > 0.3 ? 0.7 : 0.3;

    case "mysterious":
      // Works for seekers and curious types
      return citizen.attributes.personalityArchetype === "seeker" ||
        citizen.attributes.curiosityAboutDivinity > 0.6
        ? 0.8
        : 0.4;

    default:
      return 0.5;
  }
}

/**
 * Calculate divine relationship history factor
 * Based on existing divine memories
 */
function calculateDivineRelationshipHistory(citizen: Citizen): number {
  // In a real implementation, this would check citizen's divine memories
  // For now, use trustInGod as a proxy
  return Math.max(0, citizen.state.trustInGod);
}

/**
 * Determine how the citizen receives the whisper
 */
function determineReception(
  receptivity: number,
  citizen: Citizen,
  tone: WhisperTone
): WhisperReception {
  const { personalityArchetype, authorityTrustBias } = citizen.attributes;

  // Personality affects reception
  if (personalityArchetype === "believer" && receptivity > 0.3) {
    return "accepted";
  }

  if (personalityArchetype === "skeptic") {
    if (receptivity > 0.7) return "questioned";
    if (receptivity > 0.4) return "ignored";
    return "resisted";
  }

  if (personalityArchetype === "rebel" && authorityTrustBias < 0) {
    return receptivity > 0.6 ? "questioned" : "resisted";
  }

  if (personalityArchetype === "seeker") {
    return receptivity > 0.5 ? "accepted" : "questioned";
  }

  // General reception based on receptivity threshold
  if (receptivity >= 0.7) return "accepted";
  if (receptivity >= 0.5) return "questioned";
  if (receptivity >= 0.3) return "ignored";
  if (receptivity >= 0.15) return "misinterpreted";
  return "resisted";
}

// ============================================
// IMPACT CALCULATION
// ============================================

interface WhisperImpacts {
  emotionalImpact: number;
  stateChanges: Partial<Citizen["state"]>;
  beliefImpact?: { topic: string; stanceChange: number };
}

/**
 * Calculate the impacts of a whisper on the citizen
 */
function calculateWhisperImpacts(
  reception: WhisperReception,
  input: DivineWhisperInput,
  citizen: Citizen,
  factors: WhisperEffectFactors
): WhisperImpacts {
  const sensitivity = citizen.attributes.emotionalSensitivity;

  let emotionalImpact = 0;
  const stateChanges: Partial<Citizen["state"]> = {};

  switch (reception) {
    case "accepted":
      // Positive emotional impact, increased trust
      emotionalImpact = 0.3 + sensitivity * 0.3;
      stateChanges.trustInGod = Math.min(1, citizen.state.trustInGod + 0.1);
      stateChanges.hope = Math.min(1, citizen.state.hope + 0.1);
      if (input.tone === "comforting") {
        stateChanges.stress = Math.max(0, citizen.state.stress - 0.15);
        stateChanges.mood = Math.min(1, citizen.state.mood + 0.1);
      }
      break;

    case "questioned":
      // Neutral to slight positive, increased curiosity effect
      emotionalImpact = 0.1 + sensitivity * 0.1;
      stateChanges.cognitiveDissonance = Math.min(
        1,
        citizen.state.cognitiveDissonance + 0.1
      );
      break;

    case "ignored":
      // Minimal impact
      emotionalImpact = 0;
      break;

    case "resisted":
      // Negative impact, decreased trust
      emotionalImpact = -0.2 - sensitivity * 0.2;
      stateChanges.trustInGod = Math.max(-1, citizen.state.trustInGod - 0.1);
      stateChanges.cognitiveDissonance = Math.min(
        1,
        citizen.state.cognitiveDissonance + 0.15
      );
      break;

    case "misinterpreted":
      // Could go either way
      emotionalImpact = (Math.random() - 0.5) * 0.3;
      stateChanges.cognitiveDissonance = Math.min(
        1,
        citizen.state.cognitiveDissonance + 0.2
      );
      break;

    case "shared":
      // Positive for the citizen, but spreads the message
      emotionalImpact = 0.2 + sensitivity * 0.2;
      stateChanges.trustInGod = Math.min(1, citizen.state.trustInGod + 0.05);
      break;
  }

  // Detect if whisper is about a belief topic
  const beliefImpact = detectBeliefImpact(input.content, reception, citizen);

  return {
    emotionalImpact,
    stateChanges,
    beliefImpact,
  };
}

/**
 * Detect if the whisper affects any beliefs
 */
function detectBeliefImpact(
  content: string,
  reception: WhisperReception,
  citizen: Citizen
): { topic: string; stanceChange: number } | undefined {
  // Simple topic detection (could be enhanced with AI)
  const topics = [
    { keywords: ["hope", "future", "better"], topic: "hope_for_future" },
    { keywords: ["trust", "faith", "believe"], topic: "divine_trust" },
    { keywords: ["love", "kindness", "compassion"], topic: "universal_love" },
    { keywords: ["truth", "honest", "real"], topic: "truth_seeking" },
    { keywords: ["community", "together", "unity"], topic: "social_unity" },
  ];

  const lowerContent = content.toLowerCase();

  for (const { keywords, topic } of topics) {
    if (keywords.some((kw) => lowerContent.includes(kw))) {
      // Calculate stance change based on reception
      let stanceChange = 0;
      switch (reception) {
        case "accepted":
          stanceChange = 0.15;
          break;
        case "questioned":
          stanceChange = 0.05;
          break;
        case "resisted":
          stanceChange = -0.1;
          break;
        case "shared":
          stanceChange = 0.1;
          break;
        default:
          stanceChange = 0;
      }

      if (stanceChange !== 0) {
        return { topic, stanceChange };
      }
    }
  }

  return undefined;
}

// ============================================
// RESPONSE GENERATION
// ============================================

/**
 * Generate the citizen's internal response to the whisper
 */
function generateCitizenResponse(
  reception: WhisperReception,
  input: DivineWhisperInput,
  citizen: Citizen
): string {
  const { personalityArchetype } = citizen.attributes;
  const { name } = citizen;

  // Response templates based on reception and personality
  const responses: Record<WhisperReception, string[]> = {
    accepted: [
      `${name} feels a sense of peace wash over them. "I hear you," they whisper back.`,
      `A warmth spreads through ${name}'s chest. They close their eyes and listen.`,
      `${name} nods slowly, as if understanding something they couldn't quite grasp before.`,
      `"Thank you," ${name} murmurs, feeling less alone in that moment.`,
    ],
    questioned: [
      `${name} furrows their brow. "What does this mean?" they wonder.`,
      `${name} pauses, turning the words over in their mind. There's something there...`,
      `"Is this real?" ${name} asks the empty air, unsure but intrigued.`,
      `${name} feels uncertain but curious. Perhaps there is more to understand.`,
    ],
    ignored: [
      `${name} shakes their head, dismissing the feeling as imagination.`,
      `The words fade from ${name}'s awareness, lost in daily concerns.`,
      `${name} is too distracted to notice anything unusual.`,
      `Life goes on for ${name}, the moment passing without recognition.`,
    ],
    resisted: [
      `${name}'s jaw tightens. "I don't need divine interference," they think.`,
      `A flash of anger crosses ${name}'s face. They refuse to listen.`,
      `${name} actively pushes the feeling away. "Leave me alone."`,
      `Defiance rises in ${name}. They will not be manipulated by unseen forces.`,
    ],
    misinterpreted: [
      `${name} hears the words but understands something quite different.`,
      `The message reaches ${name}, but twisted into a new meaning.`,
      `${name}'s mind reshapes the whisper into something familiar but wrong.`,
      `Through ${name}'s filter of experience, the meaning transforms.`,
    ],
    shared: [
      `${name}'s eyes widen. "I must tell someone about this," they decide.`,
      `A surge of certainty fills ${name}. Others need to hear this message.`,
      `${name} feels compelled to share what they've experienced.`,
      `"This is too important to keep to myself," ${name} realizes.`,
    ],
  };

  const options = responses[reception];
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

// ============================================
// TONE RECOMMENDATIONS
// ============================================

/**
 * Recommend the best tone for a whisper based on citizen state
 */
export function recommendWhisperTone(citizen: Citizen): {
  recommended: WhisperTone;
  reasoning: string;
  alternatives: WhisperTone[];
} {
  const { mood, stress, hope, trustInGod } = citizen.state;
  const { personalityArchetype, curiosityAboutDivinity } = citizen.attributes;

  // High stress - use comforting
  if (stress > 0.7) {
    return {
      recommended: "comforting",
      reasoning: `${citizen.name} is highly stressed and needs comfort`,
      alternatives: ["gentle"],
    };
  }

  // Low mood - use gentle or comforting
  if (mood < -0.3) {
    return {
      recommended: "gentle",
      reasoning: `${citizen.name} is in low spirits, gentle approach recommended`,
      alternatives: ["comforting"],
    };
  }

  // Seeker personality - mysterious works well
  if (personalityArchetype === "seeker" || curiosityAboutDivinity > 0.6) {
    return {
      recommended: "mysterious",
      reasoning: `${citizen.name} is spiritually curious and responds to mystery`,
      alternatives: ["questioning"],
    };
  }

  // High hope + trust - can use urgent
  if (hope > 0.6 && trustInGod > 0.3) {
    return {
      recommended: "urgent",
      reasoning: `${citizen.name} has hope and trust, can handle urgent messages`,
      alternatives: ["questioning"],
    };
  }

  // Skeptic - use questioning
  if (personalityArchetype === "skeptic") {
    return {
      recommended: "questioning",
      reasoning: `${citizen.name} is skeptical, Socratic questioning may work better`,
      alternatives: ["mysterious"],
    };
  }

  // Default to gentle
  return {
    recommended: "gentle",
    reasoning: "Gentle approach is generally safe and effective",
    alternatives: ["comforting", "questioning"],
  };
}
