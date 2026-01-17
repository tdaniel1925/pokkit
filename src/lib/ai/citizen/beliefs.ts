/**
 * POKKIT Citizen Belief System
 *
 * Citizens have beliefs that:
 * - Form from experience, social influence, or divine intervention
 * - Change based on evidence and emotional impact
 * - Create cognitive dissonance when contradicted
 */

import type { CitizenBelief, CitizenDynamicState, CitizenAttributes } from "@/types/citizen";
import { v4 as uuid } from "uuid";

// Core belief topics in the simulation
export const BELIEF_TOPICS = {
  DIVINE_EXISTENCE: "divine_existence",
  DIVINE_BENEVOLENCE: "divine_benevolence",
  DIVINE_POWER: "divine_power",
  FREE_WILL: "free_will",
  AFTERLIFE: "afterlife",
  MEANING_OF_LIFE: "meaning_of_life",
  TRUST_IN_OTHERS: "trust_in_others",
  SELF_WORTH: "self_worth",
  HOPE_FOR_FUTURE: "hope_for_future",
} as const;

export type BeliefTopic = (typeof BELIEF_TOPICS)[keyof typeof BELIEF_TOPICS];

/**
 * Generate initial beliefs for a new citizen
 */
export function generateInitialBeliefs(
  attributes: CitizenAttributes,
  tick: number
): CitizenBelief[] {
  const beliefs: CitizenBelief[] = [];

  // Divine existence belief (influenced by archetype)
  beliefs.push(
    createBelief(
      BELIEF_TOPICS.DIVINE_EXISTENCE,
      getInitialDivineStance(attributes),
      0.5 + Math.random() * 0.3,
      "innate",
      tick
    )
  );

  // Divine benevolence (if they believe in divine)
  if (attributes.curiosityAboutDivinity > 0.5) {
    beliefs.push(
      createBelief(
        BELIEF_TOPICS.DIVINE_BENEVOLENCE,
        attributes.authorityTrustBias * 0.5,
        0.4,
        "innate",
        tick
      )
    );
  }

  // Free will belief
  beliefs.push(
    createBelief(
      BELIEF_TOPICS.FREE_WILL,
      attributes.personalityArchetype === "rebel" ? 0.8 : 0.5,
      0.6,
      "innate",
      tick
    )
  );

  // Self-worth
  beliefs.push(
    createBelief(
      BELIEF_TOPICS.SELF_WORTH,
      0.5 + Math.random() * 0.3,
      0.5,
      "innate",
      tick
    )
  );

  // Hope for future
  beliefs.push(
    createBelief(
      BELIEF_TOPICS.HOPE_FOR_FUTURE,
      0.5 + Math.random() * 0.4,
      0.5,
      "innate",
      tick
    )
  );

  return beliefs;
}

function getInitialDivineStance(attributes: CitizenAttributes): number {
  const { personalityArchetype, curiosityAboutDivinity, authorityTrustBias } = attributes;

  let base = 0;

  switch (personalityArchetype) {
    case "believer":
      base = 0.7;
      break;
    case "skeptic":
      base = -0.3;
      break;
    case "cynic":
      base = -0.5;
      break;
    case "seeker":
      base = 0.3;
      break;
    default:
      base = 0;
  }

  // Adjust based on other attributes
  base += curiosityAboutDivinity * 0.2;
  base += authorityTrustBias * 0.1;

  return Math.max(-1, Math.min(1, base));
}

/**
 * Create a new belief
 */
export function createBelief(
  topic: string,
  stance: number,
  confidence: number,
  origin: CitizenBelief["origin"],
  tick: number
): CitizenBelief {
  return {
    id: uuid(),
    topic,
    stance: Math.max(-1, Math.min(1, stance)),
    confidence: Math.max(0, Math.min(1, confidence)),
    origin,
    formedAtTick: tick,
  };
}

/**
 * Update a belief based on new evidence/experience
 */
export function updateBelief(
  belief: CitizenBelief,
  newEvidence: number, // -1 to 1 (against to for)
  evidenceStrength: number, // 0 to 1
  state: CitizenDynamicState
): { updatedBelief: CitizenBelief; dissonanceIncrease: number } {
  // Calculate how much the evidence conflicts with current belief
  const conflict = Math.abs(newEvidence - belief.stance);

  // Emotional state affects belief flexibility
  const emotionalFactor = 1 - state.stress * 0.3; // High stress = more rigid

  // Calculate stance change
  const changeAmount = (newEvidence - belief.stance) * evidenceStrength * emotionalFactor * 0.2;

  // Update confidence
  let newConfidence = belief.confidence;
  if (Math.sign(newEvidence) === Math.sign(belief.stance)) {
    // Evidence aligns - increase confidence
    newConfidence = Math.min(1, belief.confidence + evidenceStrength * 0.1);
  } else {
    // Evidence conflicts - decrease confidence
    newConfidence = Math.max(0.1, belief.confidence - evidenceStrength * 0.15);
  }

  // Calculate cognitive dissonance from conflicting evidence
  const dissonanceIncrease = conflict * evidenceStrength * belief.confidence * 0.1;

  return {
    updatedBelief: {
      ...belief,
      stance: Math.max(-1, Math.min(1, belief.stance + changeAmount)),
      confidence: newConfidence,
    },
    dissonanceIncrease,
  };
}

/**
 * Process divine intervention effect on beliefs
 */
export function processDivineImpactOnBeliefs(
  beliefs: CitizenBelief[],
  experienceType: "positive" | "negative" | "neutral",
  intensity: number,
  tick: number
): CitizenBelief[] {
  return beliefs.map((belief) => {
    // Divine existence belief
    if (belief.topic === BELIEF_TOPICS.DIVINE_EXISTENCE) {
      // Any divine interaction is evidence of existence
      return {
        ...belief,
        stance: Math.min(1, belief.stance + intensity * 0.3),
        confidence: Math.min(1, belief.confidence + 0.1),
      };
    }

    // Divine benevolence belief
    if (belief.topic === BELIEF_TOPICS.DIVINE_BENEVOLENCE) {
      const change =
        experienceType === "positive"
          ? intensity * 0.4
          : experienceType === "negative"
            ? -intensity * 0.4
            : 0;
      return {
        ...belief,
        stance: Math.max(-1, Math.min(1, belief.stance + change)),
      };
    }

    // Free will belief (divine intervention may challenge it)
    if (belief.topic === BELIEF_TOPICS.FREE_WILL && intensity > 0.7) {
      return {
        ...belief,
        stance: Math.max(-1, belief.stance - 0.1),
        confidence: Math.max(0.2, belief.confidence - 0.1),
      };
    }

    return belief;
  });
}

/**
 * Build belief context for AI prompt
 */
export function buildBeliefContext(beliefs: CitizenBelief[]): string {
  if (beliefs.length === 0) return "No established beliefs yet.";

  const lines: string[] = ["CURRENT BELIEFS:"];

  for (const belief of beliefs) {
    const stanceDesc =
      belief.stance > 0.5
        ? "strongly believes"
        : belief.stance > 0
          ? "somewhat believes"
          : belief.stance > -0.5
            ? "doubts"
            : "strongly disbelieves";

    const confDesc =
      belief.confidence > 0.7
        ? "(very confident)"
        : belief.confidence > 0.4
          ? "(moderately confident)"
          : "(uncertain)";

    lines.push(`- ${formatTopic(belief.topic)}: ${stanceDesc} ${confDesc}`);
  }

  return lines.join("\n");
}

function formatTopic(topic: string): string {
  return topic
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
