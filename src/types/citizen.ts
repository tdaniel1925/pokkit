import { z } from "zod";

// Personality archetypes
export const PersonalityArchetypes = [
  "skeptic",
  "believer",
  "pragmatist",
  "idealist",
  "rebel",
  "conformist",
  "seeker",
  "cynic",
] as const;

export type PersonalityArchetype = (typeof PersonalityArchetypes)[number];

// Static attributes (from PRD section 5.1)
export const CitizenAttributesSchema = z.object({
  personalityArchetype: z.enum(PersonalityArchetypes),
  emotionalSensitivity: z.number().min(0).max(1), // how strongly emotions affect them
  authorityTrustBias: z.number().min(-1).max(1), // -1 = distrustful, 1 = trusting
  socialInfluencePotential: z.number().min(0).max(1), // ability to influence others
  curiosityAboutDivinity: z.number().min(0).max(1), // interest in God/divine
});

export type CitizenAttributes = z.infer<typeof CitizenAttributesSchema>;

// Dynamic state (from PRD section 5.2)
export interface CitizenDynamicState {
  mood: number; // -1 to 1 (despair to joy)
  stress: number; // 0 to 1
  hope: number; // 0 to 1
  trustInPeers: number; // 0 to 1
  trustInGod: number; // -1 to 1 (hatred to devotion)
  cognitiveDissonance: number; // 0 to 1 (internal conflict)
}

// Consent thresholds (from PRD section 8.3)
export interface ConsentThresholds {
  emotionalConsent: number; // 0-1, how much emotional pressure they can handle
  relationalPacingLimit: number; // 0-1, how fast relationships can develop
  authorityResistanceCurve: number; // 0-1, how much they resist authority
}

// Complete citizen model
export interface Citizen {
  id: string;
  worldId: string;
  name: string;
  attributes: CitizenAttributes;
  state: CitizenDynamicState;
  consent: ConsentThresholds;
  beliefs: CitizenBelief[];
  createdAtTick: number;
  lastActiveTick: number;
}

// Citizen beliefs
export interface CitizenBelief {
  id: string;
  topic: string; // what the belief is about
  stance: number; // -1 to 1 (against to for)
  confidence: number; // 0 to 1 (how certain)
  origin: "innate" | "social" | "divine" | "experience";
  formedAtTick: number;
}

// Citizen relationships
export interface CitizenRelationship {
  id: string;
  citizenId: string;
  targetCitizenId: string;
  type: "friend" | "family" | "rival" | "acquaintance" | "enemy";
  strength: number; // 0 to 1
  trust: number; // -1 to 1
  lastInteractionTick: number;
}

// Memory types (from PRD section 5.3)
export interface CitizenMemory {
  id: string;
  citizenId: string;
  type: "short_term" | "long_term" | "divine_interaction";
  content: string;
  emotionalWeight: number; // -1 to 1 (negative to positive)
  importance: number; // 0 to 1
  tick: number;
  decayRate: number; // for short-term memories
  isDivine: boolean; // divine memories are non-erasable
}

// Citizen post (their thoughts/actions visible in world feed)
export interface CitizenPost {
  id: string;
  citizenId: string;
  worldId: string;
  content: string;
  type: "thought" | "statement" | "action" | "prayer" | "question";
  targetCitizenId?: string; // if directed at someone
  visibility: "public" | "private" | "divine_only";
  tick: number;
  createdAt: Date;
}
