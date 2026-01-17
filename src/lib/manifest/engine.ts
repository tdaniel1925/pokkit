/**
 * Manifest Engine - Phase 3
 * From PRD PROMPT 10: Manifest Mode (MVP: Rare, High Cost)
 *
 * Handles God's public revelations and citizen reactions.
 * High cost, high impact, with cooldown to prevent spam.
 */

import { checkGuardrails } from "@/lib/guardrails";
import type { Citizen } from "@/types/citizen";
import type { WorldState } from "@/types/world";
import type {
  ManifestActionInput,
  ManifestResult,
  Manifestation,
  ManifestReaction,
  ManifestReactionType,
  RevelationType,
  ManifestIntensity,
  WorldInstability,
  SocietalEffect,
} from "@/types/manifest";
import {
  isManifestOnCooldown,
  predictCitizenReaction,
  getReactionDescription,
  getRevelationDescription,
  MANIFEST_COOLDOWN_TICKS,
  INTENSITY_IMPACT,
} from "@/types/manifest";

// Re-export helpers
export {
  isManifestOnCooldown,
  predictCitizenReaction,
  getReactionDescription,
  getRevelationDescription,
  MANIFEST_COOLDOWN_TICKS,
  INTENSITY_IMPACT,
};

/**
 * Execute a divine manifestation
 */
export async function executeManifest(
  input: ManifestActionInput,
  world: WorldState,
  citizens: Citizen[]
): Promise<ManifestResult> {
  // Check guardrails on the revelation content
  const guardrailResult = await checkGuardrails({
    source: "god_action",
    content: input.content,
    context: {
      worldId: world.id,
      presenceMode: "manifest",
    },
  });

  // Get current instability from world (may be stored in DB record)
  const currentInstability = (world as { instability?: number }).instability ?? 0;

  if (!guardrailResult.passed) {
    return {
      success: false,
      reactions: [],
      newInstability: currentInstability,
      cooldownUntilTick: world.tick,
      guardrailWarnings: guardrailResult.warnings,
      blocked: true,
      blockReason: guardrailResult.warnings?.[0] || "Blocked by guardrails",
    };
  }

  // Calculate instability impact
  const instabilityImpact = getInstabilityImpact(input.intensity);
  const newInstability = Math.min(1, currentInstability + instabilityImpact);

  // Determine affected citizens based on target audience
  const affectedCitizens = filterAffectedCitizens(
    citizens,
    input.targetAudience || "all"
  );

  // Generate reactions for each citizen
  const reactions: ManifestReaction[] = [];
  const reactionCounts: Record<ManifestReactionType, number> = {
    worship: 0,
    awe: 0,
    fear: 0,
    denial: 0,
    skepticism: 0,
    anger: 0,
    ecstasy: 0,
    despair: 0,
  };

  for (const citizen of affectedCitizens) {
    const reaction = generateCitizenReaction(
      citizen,
      input.type,
      input.intensity,
      world.tick
    );
    reactions.push(reaction);
    reactionCounts[reaction.reaction]++;
  }

  // Find dominant reaction
  const dominantReaction = Object.entries(reactionCounts).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as ManifestReactionType;

  // Create the manifestation record
  const manifestation: Manifestation = {
    id: crypto.randomUUID(),
    worldId: world.id,
    type: input.type,
    intensity: input.intensity,
    content: input.content,
    tick: world.tick,
    instabilityImpact,
    affectedCitizenCount: affectedCitizens.length,
    dominantReaction,
    reactionBreakdown: reactionCounts,
    createdAt: new Date(),
  };

  // Calculate cooldown
  const cooldownUntilTick = world.tick + MANIFEST_COOLDOWN_TICKS;

  return {
    success: true,
    manifestation,
    reactions,
    newInstability,
    cooldownUntilTick,
    guardrailWarnings: guardrailResult.warnings,
  };
}

/**
 * Get instability impact based on intensity
 */
function getInstabilityImpact(intensity: ManifestIntensity): number {
  const impacts: Record<ManifestIntensity, number> = {
    subtle: 0.05,
    notable: 0.15,
    undeniable: 0.3,
    overwhelming: 0.5,
  };
  return impacts[intensity];
}

/**
 * Filter citizens based on target audience
 */
function filterAffectedCitizens(
  citizens: Citizen[],
  targetAudience: "all" | "believers" | "skeptics" | "suffering"
): Citizen[] {
  switch (targetAudience) {
    case "believers":
      return citizens.filter((c) => c.state.trustInGod > 0.5);
    case "skeptics":
      return citizens.filter((c) => c.state.trustInGod < 0.3);
    case "suffering":
      return citizens.filter((c) => c.state.stress > 0.6 || c.state.mood < -0.3);
    case "all":
    default:
      return citizens;
  }
}

/**
 * Generate a citizen's reaction to a manifestation
 */
function generateCitizenReaction(
  citizen: Citizen,
  revelationType: RevelationType,
  intensity: ManifestIntensity,
  tick: number
): ManifestReaction {
  const reaction = determineReaction(citizen, revelationType, intensity);
  const reactionIntensity = calculateReactionIntensity(citizen, intensity);
  const { beliefShift, trustChange } = calculateBeliefImpact(
    citizen,
    reaction,
    reactionIntensity
  );

  return {
    id: crypto.randomUUID(),
    manifestationId: "", // Will be set when stored
    citizenId: citizen.id,
    reaction,
    intensity: reactionIntensity,
    beliefShift,
    trustChange,
    memoryCreated: true,
    publicResponse: generatePublicResponse(citizen, reaction, revelationType),
    tick,
    createdAt: new Date(),
  };
}

/**
 * Determine what reaction a citizen will have
 */
function determineReaction(
  citizen: Citizen,
  revelationType: RevelationType,
  intensity: ManifestIntensity
): ManifestReactionType {
  const trust = citizen.state.trustInGod;
  // Derive skepticism from archetype or inverse of curiosity about divinity
  const isSkepticalArchetype = citizen.attributes.personalityArchetype === "skeptic" ||
                               citizen.attributes.personalityArchetype === "cynic";
  const skepticism = isSkepticalArchetype ? 0.8 : (1 - citizen.attributes.curiosityAboutDivinity);
  const emotionalSensitivity = citizen.attributes.emotionalSensitivity;
  const stress = citizen.state.stress;
  const authorityBias = citizen.attributes.authorityTrustBias;

  // Random factor for variety
  const randomFactor = Math.random();

  // High trust citizens
  if (trust > 0.7) {
    if (intensity === "overwhelming" && emotionalSensitivity > 0.6) {
      return randomFactor > 0.4 ? "ecstasy" : "worship";
    }
    if (revelationType === "judgment" && randomFactor > 0.7) {
      return "fear";
    }
    return randomFactor > 0.3 ? "worship" : "awe";
  }

  // Medium trust citizens
  if (trust > 0.3) {
    if (skepticism > 0.6) {
      return intensity === "overwhelming" ? "awe" : "skepticism";
    }
    if (revelationType === "warning" && stress > 0.5) {
      return "fear";
    }
    return randomFactor > 0.5 ? "awe" : "worship";
  }

  // Low trust citizens
  if (trust > 0) {
    if (intensity === "overwhelming") {
      // Even skeptics can be moved
      return randomFactor > 0.6 ? "awe" : "denial";
    }
    return randomFactor > 0.4 ? "skepticism" : "denial";
  }

  // Negative trust (hostile to divine)
  if (stress > 0.6 && emotionalSensitivity > 0.5) {
    return randomFactor > 0.5 ? "despair" : "fear";
  }
  if (authorityBias < 0.3) {
    return "anger";
  }
  return intensity === "overwhelming" ? "fear" : "anger";
}

/**
 * Calculate how intensely the citizen reacts
 */
function calculateReactionIntensity(
  citizen: Citizen,
  manifestIntensity: ManifestIntensity
): number {
  const baseIntensity = {
    subtle: 0.3,
    notable: 0.5,
    undeniable: 0.7,
    overwhelming: 0.9,
  }[manifestIntensity];

  // Emotional sensitivity increases reaction intensity
  const sensitivityModifier = citizen.attributes.emotionalSensitivity * 0.2;

  // Existing stress can amplify reactions
  const stressModifier = citizen.state.stress * 0.1;

  return Math.min(1, baseIntensity + sensitivityModifier + stressModifier);
}

/**
 * Calculate belief and trust changes from reaction
 */
function calculateBeliefImpact(
  citizen: Citizen,
  reaction: ManifestReactionType,
  intensity: number
): { beliefShift: number; trustChange: number } {
  const impactMap: Record<
    ManifestReactionType,
    { beliefBase: number; trustBase: number }
  > = {
    worship: { beliefBase: 0.3, trustBase: 0.3 },
    awe: { beliefBase: 0.15, trustBase: 0.15 },
    fear: { beliefBase: 0.1, trustBase: -0.1 },
    denial: { beliefBase: -0.1, trustBase: -0.15 },
    skepticism: { beliefBase: 0, trustBase: -0.05 },
    anger: { beliefBase: -0.2, trustBase: -0.3 },
    ecstasy: { beliefBase: 0.4, trustBase: 0.4 },
    despair: { beliefBase: -0.1, trustBase: -0.2 },
  };

  const { beliefBase, trustBase } = impactMap[reaction];

  return {
    beliefShift: beliefBase * intensity,
    trustChange: trustBase * intensity,
  };
}

/**
 * Generate what the citizen might say publicly about the manifestation
 */
function generatePublicResponse(
  citizen: Citizen,
  reaction: ManifestReactionType,
  revelationType: RevelationType
): string | undefined {
  // Not all citizens respond publicly
  if (Math.random() > 0.6) return undefined;

  const responses: Record<ManifestReactionType, string[]> = {
    worship: [
      "Did you feel that? The divine presence was unmistakable!",
      "I knew it. I always knew they were watching over us.",
      "We are truly blessed to witness such glory.",
      "This changes everything. We must share this with everyone.",
    ],
    awe: [
      "I... I don't have words for what just happened.",
      "Something incredible just occurred. I need time to process this.",
      "Was that real? I can still feel it in my bones.",
      "I've never experienced anything like this before.",
    ],
    fear: [
      "What does this mean for us? I'm afraid...",
      "We should be careful. Such power is not to be taken lightly.",
      "I saw something today that terrified me to my core.",
      "Perhaps we've been wrong about everything...",
    ],
    denial: [
      "There must be a rational explanation for this.",
      "Mass hysteria, nothing more. Don't be fooled.",
      "I refuse to believe what others claim they saw.",
      "Coincidence. The mind sees patterns where there are none.",
    ],
    skepticism: [
      "Interesting phenomenon, but I remain unconvinced.",
      "I'll need more evidence before I change my worldview.",
      "Strange events happen. Doesn't mean gods are real.",
      "Let's not jump to supernatural conclusions.",
    ],
    anger: [
      "How dare they intrude upon our lives like this!",
      "We don't need divine interference in our affairs.",
      "This is manipulation, nothing more. I won't be controlled.",
      "If they truly cared, where were they when we suffered?",
    ],
    ecstasy: [
      "I have never felt such profound joy and peace!",
      "Everything makes sense now. The purpose, the meaning... it's all clear!",
      "I wept tears of pure happiness. We are loved beyond measure.",
      "This is the most beautiful moment of my existence.",
    ],
    despair: [
      "If this is real... then what have we been doing with our lives?",
      "I feel utterly insignificant in the face of such power.",
      "My beliefs, my certainties... all shattered in an instant.",
      "I don't know what to think anymore. Everything feels meaningless.",
    ],
  };

  const options = responses[reaction];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Calculate new instability trend based on current level
 */
export function calculateInstabilityTrend(
  instability: number,
  previousInstability: number
): "stable" | "rising" | "falling" | "critical" {
  if (instability >= 0.8) return "critical";
  if (instability > previousInstability + 0.05) return "rising";
  if (instability < previousInstability - 0.05) return "falling";
  return "stable";
}

/**
 * Get societal effects based on instability level
 */
export function getSocietalEffects(
  instability: number,
  tick: number
): SocietalEffect[] {
  const effects: SocietalEffect[] = [];

  if (instability >= 0.3) {
    effects.push({
      type: "polarization",
      strength: instability * 0.5,
      description: "Society is becoming divided on matters of faith",
      triggeredAtTick: tick,
    });
  }

  if (instability >= 0.5) {
    effects.push({
      type: "religious_fervor",
      strength: instability * 0.6,
      description: "Religious activity and devotion are intensifying",
      triggeredAtTick: tick,
    });
    effects.push({
      type: "fear_spreading",
      strength: instability * 0.4,
      description: "Anxiety about the divine presence spreads among citizens",
      triggeredAtTick: tick,
    });
  }

  if (instability >= 0.7) {
    effects.push({
      type: "prophet_emergence",
      strength: instability * 0.5,
      description: "Some citizens claim special connection to the divine",
      triggeredAtTick: tick,
    });
  }

  if (instability >= 0.9) {
    effects.push({
      type: "schism",
      strength: instability * 0.8,
      description:
        "Major splits emerge in society over interpretation of divine events",
      triggeredAtTick: tick,
    });
    effects.push({
      type: "social_breakdown",
      strength: instability * 0.6,
      description: "Social structures begin to fray under spiritual pressure",
      triggeredAtTick: tick,
    });
  }

  return effects;
}

/**
 * Generate memory content for a citizen's reaction to manifestation
 */
export function generateManifestMemory(
  reaction: ManifestReactionType,
  revelationType: RevelationType,
  content: string
): string {
  const excerpt = content.length > 50 ? content.slice(0, 50) + "..." : content;

  const templates: Record<ManifestReactionType, string> = {
    worship: `I witnessed a divine ${revelationType}: "${excerpt}" I fell to my knees in reverence. This moment will define my faith forever.`,
    awe: `Something extraordinary happened - a ${revelationType} from above: "${excerpt}" I am still trying to understand what it means.`,
    fear: `A terrifying ${revelationType} occurred: "${excerpt}" I am shaken to my core. What does the divine want from us?`,
    denial: `Others claim a ${revelationType} happened: "${excerpt}" But I refuse to accept supernatural explanations. There must be another answer.`,
    skepticism: `An unusual event occurred that some call a ${revelationType}: "${excerpt}" I remain skeptical and require more evidence.`,
    anger: `The so-called divine dared to intrude with a ${revelationType}: "${excerpt}" I resent this interference in our lives.`,
    ecstasy: `I experienced pure transcendence during the ${revelationType}: "${excerpt}" Joy beyond description filled my entire being.`,
    despair: `The ${revelationType} shattered my worldview: "${excerpt}" I no longer know what to believe or who I am.`,
  };

  return templates[reaction];
}
