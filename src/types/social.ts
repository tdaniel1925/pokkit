import { z } from "zod";

// ============================================
// PHASE 2: SOCIAL DYNAMICS & WHISPERER MODE
// ============================================

// --- WHISPER TYPES (Divine Communication) ---

/**
 * Whisper tone affects how the message is perceived
 * Based on PRD Section 7.3 - Whisperer Mode
 */
export const WhisperTones = [
  "gentle", // Soft, non-intrusive suggestion
  "urgent", // Time-sensitive, creates slight pressure
  "questioning", // Socratic, prompts reflection
  "comforting", // Emotional support
  "warning", // Alert without command
  "mysterious", // Cryptic, provokes curiosity
] as const;

export type WhisperTone = (typeof WhisperTones)[number];

/**
 * How the citizen interprets/receives the whisper
 */
export const WhisperReceptions = [
  "accepted", // Citizen embraces the message
  "questioned", // Citizen is curious but skeptical
  "ignored", // Citizen dismisses it
  "resisted", // Citizen actively rejects it
  "misinterpreted", // Citizen gets wrong meaning
  "shared", // Citizen tells others about it
] as const;

export type WhisperReception = (typeof WhisperReceptions)[number];

/**
 * A divine whisper to a citizen
 */
export interface DivineWhisper {
  id: string;
  worldId: string;
  targetCitizenId: string;
  content: string;
  tone: WhisperTone;
  tick: number;
  // Response tracking
  reception?: WhisperReception;
  citizenResponse?: string;
  emotionalImpact?: number; // -1 to 1
  beliefImpact?: {
    topic: string;
    stanceChange: number;
  };
  // Safety
  passedGuardrails: boolean;
  guardrailNotes?: string;
  createdAt: Date;
}

export const DivineWhisperSchema = z.object({
  targetCitizenId: z.string().uuid(),
  content: z.string().min(1).max(500),
  tone: z.enum(WhisperTones),
});

export type DivineWhisperInput = z.infer<typeof DivineWhisperSchema>;

// --- SOCIAL DYNAMICS TYPES ---

/**
 * Relationship evolution over time
 */
export interface RelationshipEvent {
  id: string;
  relationshipId: string;
  type: "formed" | "strengthened" | "weakened" | "broken" | "transformed";
  oldType?: string;
  newType?: string;
  strengthChange: number;
  trustChange: number;
  cause: "interaction" | "divine_influence" | "crisis" | "time" | "betrayal";
  tick: number;
  description: string;
}

/**
 * Types of social interactions between citizens
 */
export const SocialInteractionTypes = [
  "conversation", // General talk
  "debate", // Discussion of beliefs
  "support", // Emotional support
  "conflict", // Disagreement/fight
  "collaboration", // Working together
  "gossip", // Sharing information about others
  "teaching", // Passing knowledge
  "celebration", // Joy together
  "mourning", // Grief together
  "ritual", // Religious/cultural practice
] as const;

export type SocialInteractionType = (typeof SocialInteractionTypes)[number];

/**
 * A social interaction between citizens
 */
export interface SocialInteraction {
  id: string;
  worldId: string;
  tick: number;
  type: SocialInteractionType;
  participants: string[]; // citizen IDs
  initiatorId: string;
  content: string; // What happened
  topic?: string; // If discussing something specific
  outcomes: {
    citizenId: string;
    moodChange: number;
    stressChange: number;
    trustChange?: number; // Trust in other participant
    beliefInfluence?: {
      topic: string;
      stanceChange: number;
    };
  }[];
  visibility: "public" | "private" | "witnessed"; // Who can see it
  witnesses?: string[]; // Citizen IDs who saw but weren't involved
  createdAt: Date;
}

/**
 * Social influence - when a citizen affects another's beliefs
 */
export interface SocialInfluence {
  id: string;
  worldId: string;
  influencerId: string;
  targetId: string;
  tick: number;
  topic: string;
  influenceStrength: number; // 0 to 1
  wasSuccessful: boolean;
  targetStanceChange: number;
  method: "argument" | "example" | "pressure" | "charisma" | "evidence";
}

// --- CULTURAL MOVEMENT TYPES ---

/**
 * Stages of a cultural movement
 */
export const MovementStages = [
  "nascent", // Just forming, few believers
  "growing", // Gaining traction
  "mainstream", // Widely adopted
  "dominant", // Controls society
  "declining", // Losing followers
  "underground", // Suppressed but active
  "extinct", // No followers left
] as const;

export type MovementStage = (typeof MovementStages)[number];

/**
 * A cultural or religious movement
 */
export interface CulturalMovement {
  id: string;
  worldId: string;
  name: string;
  description: string;
  coreBeliefs: {
    topic: string;
    stance: number; // -1 to 1
  }[];
  stage: MovementStage;
  founderId?: string; // Citizen who started it
  leaderIds: string[]; // Current leaders
  followerIds: string[]; // Current members
  influence: number; // 0 to 1, how much power it has
  divineRelation: "pro_divine" | "anti_divine" | "agnostic" | "heretical";
  emergedAtTick: number;
  lastActivityTick: number;
  history: {
    tick: number;
    event: string;
    stageChange?: MovementStage;
  }[];
}

/**
 * Collective event - something that affects many citizens
 */
export interface CollectiveEvent {
  id: string;
  worldId: string;
  tick: number;
  type: "celebration" | "crisis" | "disaster" | "miracle" | "revelation" | "schism" | "reform";
  name: string;
  description: string;
  affectedCitizenIds: string[];
  movementId?: string; // If tied to a movement
  divinelyInfluenced: boolean;
  outcomes: {
    worldStabilityChange: number;
    culturalEntropyChange: number;
    averageMoodChange: number;
    averageHopeChange: number;
    beliefShifts: {
      topic: string;
      averageStanceChange: number;
    }[];
  };
  createdAt: Date;
}

/**
 * Social network analysis for a world
 */
export interface SocialNetworkStats {
  worldId: string;
  tick: number;
  totalRelationships: number;
  averageConnectionsPerCitizen: number;
  clusterCount: number; // Social groups
  mostInfluentialCitizens: {
    citizenId: string;
    influenceScore: number;
  }[];
  isolatedCitizens: string[]; // Citizens with few connections
  socialCohesion: number; // 0 to 1
  movementDistribution: {
    movementId: string;
    followerPercentage: number;
  }[];
}

// --- WHISPER EFFECTIVENESS CALCULATION ---

/**
 * Factors that affect how a whisper is received
 */
export interface WhisperEffectFactors {
  citizenTrustInGod: number;
  citizenEmotionalSensitivity: number;
  citizenCuriosity: number;
  toneMatch: number; // How well tone matches citizen's state
  relationshipHistory: number; // Prior divine interactions
  socialReinforcement: number; // Do peers support the message?
  cognitiveLoad: number; // Is citizen already stressed?
}

/**
 * Calculate whisper reception probability
 */
export function calculateWhisperReceptivity(factors: WhisperEffectFactors): number {
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
