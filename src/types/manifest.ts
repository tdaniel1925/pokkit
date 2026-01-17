/**
 * Manifest Mode Types - Phase 3
 * From PRD PROMPT 10: Manifest Mode (MVP: Rare, High Cost)
 *
 * God can publish "Revelation" posts that trigger high-impact world events.
 * Citizens react with divergent interpretations (worship, deny, fear).
 * Increases world instability. Has cooldown to prevent spamming.
 */

import type { Citizen } from "./citizen";

// Revelation types - what kind of divine message is this?
export type RevelationType =
  | "proclamation" // Direct statement of truth/command
  | "sign" // Miraculous event or omen
  | "visitation" // Personal appearance (described, not shown)
  | "prophecy" // Future prediction
  | "judgment" // Moral pronouncement on society
  | "blessing" // Collective blessing/gift
  | "warning"; // Divine warning of consequences

// Citizen reaction types to manifestation
export type ManifestReactionType =
  | "worship" // Accept and revere
  | "awe" // Overwhelmed, uncertain
  | "fear" // Terrified, may flee or hide
  | "denial" // Reject, rationalize away
  | "skepticism" // Question, demand proof
  | "anger" // Resent divine interference
  | "ecstasy" // Transcendent joy
  | "despair"; // Crisis of meaning

// Intensity levels for manifestations
export type ManifestIntensity =
  | "subtle" // Easily dismissed, minor instability
  | "notable" // Clear but deniable, moderate instability
  | "undeniable" // Hard to ignore, high instability
  | "overwhelming"; // Society-shaking, extreme instability

// The manifestation itself
export interface Manifestation {
  id: string;
  worldId: string;
  type: RevelationType;
  intensity: ManifestIntensity;
  content: string; // The revelation content
  tick: number;
  instabilityImpact: number; // How much this adds to world instability
  affectedCitizenCount: number;
  dominantReaction: ManifestReactionType;
  reactionBreakdown: Record<ManifestReactionType, number>; // Count by reaction type
  createdAt: Date;
}

// Individual citizen's reaction to a manifestation
export interface ManifestReaction {
  id: string;
  manifestationId: string;
  citizenId: string;
  reaction: ManifestReactionType;
  intensity: number; // 0-1, how strongly they reacted
  beliefShift: number; // -1 to 1, change in divine belief
  trustChange: number; // Change to trust_in_god
  memoryCreated: boolean;
  publicResponse?: string; // What they said/posted about it
  tick: number;
  createdAt: Date;
}

// Manifest action input from user
export interface ManifestActionInput {
  type: RevelationType;
  intensity: ManifestIntensity;
  content: string;
  targetAudience?: "all" | "believers" | "skeptics" | "suffering";
}

// Result of a manifestation
export interface ManifestResult {
  success: boolean;
  manifestation?: Manifestation;
  reactions: ManifestReaction[];
  feedItemId?: string; // The world feed item created
  newInstability: number; // New world instability level
  cooldownUntilTick: number;
  guardrailWarnings?: string[];
  blocked?: boolean;
  blockReason?: string;
}

// World instability state
export interface WorldInstability {
  current: number; // 0-1 scale
  trend: "stable" | "rising" | "falling" | "critical";
  lastManifestTick?: number;
  manifestCount: number; // Total manifestations in this world
  societalEffects: SocietalEffect[];
}

// Effects of instability on society
export interface SocietalEffect {
  type:
    | "polarization" // Society splits into factions
    | "fear_spreading" // Widespread anxiety
    | "religious_fervor" // Increased devotion
    | "mass_skepticism" // Widespread doubt
    | "social_breakdown" // Relationships deteriorating
    | "prophet_emergence" // Citizens claiming divine connection
    | "schism"; // Major belief split
  strength: number; // 0-1
  description: string;
  triggeredAtTick: number;
}

// Cooldown configuration
export const MANIFEST_COOLDOWN_TICKS = 10; // Can only manifest every 10 ticks

// Intensity to instability impact mapping
export const INTENSITY_IMPACT: Record<ManifestIntensity, number> = {
  subtle: 0.05,
  notable: 0.15,
  undeniable: 0.3,
  overwhelming: 0.5,
};

// Helper to determine if manifest is on cooldown
export function isManifestOnCooldown(
  lastManifestTick: number | undefined,
  currentTick: number,
  cooldownTicks: number = MANIFEST_COOLDOWN_TICKS
): boolean {
  if (lastManifestTick === undefined) return false;
  return currentTick - lastManifestTick < cooldownTicks;
}

// Helper to calculate citizen reaction based on their state
export function predictCitizenReaction(
  citizen: Citizen,
  manifestType: RevelationType,
  intensity: ManifestIntensity
): {
  likelyReaction: ManifestReactionType;
  probability: number;
} {
  const trust = citizen.state.trustInGod;
  // Derive skepticism from archetype or inverse of curiosity about divinity
  const isSkepticalArchetype = citizen.attributes.personalityArchetype === "skeptic" ||
                               citizen.attributes.personalityArchetype === "cynic";
  const skepticism = isSkepticalArchetype ? 0.8 : (1 - citizen.attributes.curiosityAboutDivinity);
  const emotionalSensitivity = citizen.attributes.emotionalSensitivity;
  const stress = citizen.state.stress;

  // Base reaction probabilities based on trust
  if (trust > 0.7) {
    // High trust - likely worship or awe
    if (intensity === "overwhelming") {
      return { likelyReaction: "ecstasy", probability: 0.6 };
    }
    return { likelyReaction: "worship", probability: 0.7 };
  } else if (trust > 0.3) {
    // Medium trust - awe or skepticism
    if (skepticism > 0.6) {
      return { likelyReaction: "skepticism", probability: 0.5 };
    }
    return { likelyReaction: "awe", probability: 0.5 };
  } else if (trust > 0) {
    // Low trust - skepticism or denial
    if (intensity === "overwhelming") {
      // Even skeptics can be moved by undeniable events
      return { likelyReaction: "awe", probability: 0.4 };
    }
    return { likelyReaction: "denial", probability: 0.6 };
  } else {
    // Negative trust - anger or fear
    if (stress > 0.5) {
      return { likelyReaction: "fear", probability: 0.5 };
    }
    if (emotionalSensitivity > 0.6 && intensity === "overwhelming") {
      return { likelyReaction: "despair", probability: 0.4 };
    }
    return { likelyReaction: "anger", probability: 0.5 };
  }
}

// Helper to get reaction description for feed
export function getReactionDescription(reaction: ManifestReactionType): string {
  const descriptions: Record<ManifestReactionType, string> = {
    worship: "fell to their knees in reverence",
    awe: "stood frozen, overwhelmed by what they witnessed",
    fear: "trembled, uncertain of what this means for them",
    denial: "shook their head, refusing to accept what they saw",
    skepticism: "narrowed their eyes, searching for a rational explanation",
    anger: "clenched their fists, resentful of this intrusion",
    ecstasy: "wept tears of joy, feeling truly seen",
    despair: "felt their worldview shatter, lost in existential crisis",
  };
  return descriptions[reaction];
}

// Helper to get revelation type description
export function getRevelationDescription(type: RevelationType): string {
  const descriptions: Record<RevelationType, string> = {
    proclamation: "A voice echoes through the world",
    sign: "An impossible event occurs before all eyes",
    visitation: "A presence makes itself known",
    prophecy: "Words of the future ring out",
    judgment: "The divine weighs the hearts of mortals",
    blessing: "Grace descends upon the people",
    warning: "A foreboding message pierces the air",
  };
  return descriptions[type];
}
