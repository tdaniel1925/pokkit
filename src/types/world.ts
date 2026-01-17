import { z } from "zod";

// World initialization parameters
export const WorldConfigSchema = z.object({
  name: z.string().min(1).max(100),
  populationSize: z.number().int().min(5).max(1000).default(50),
  culturalEntropy: z.number().min(0).max(1).default(0.5), // 0 = homogeneous, 1 = chaotic
  beliefPlasticity: z.number().min(0).max(1).default(0.5), // how easily beliefs change
  crisisFrequency: z.number().min(0).max(1).default(0.3), // probability of crises
  authoritySkepticismIndex: z.number().min(0).max(1).default(0.5), // distrust of authority/divine
});

export type WorldConfig = z.infer<typeof WorldConfigSchema>;

// World state
export interface WorldState {
  id: string;
  userId: string;
  config: WorldConfig;
  tick: number; // simulation time unit
  status: "active" | "paused" | "ended";
  endState?: WorldEndState;
  createdAt: Date;
  updatedAt: Date;
}

// Possible end states (from PRD section 10)
export type WorldEndState =
  | "god_irrelevant" // God becomes irrelevant
  | "society_transcends" // Society surpasses religion
  | "god_withdraws" // God withdraws
  | "cultural_fragmentation" // Society collapses
  | "eternal_ambiguity"; // Endless uncertainty

// User presence modes (from PRD v2.0)
// Observer: Watch silently, no interaction
// Influencer: Subtle environmental nudges (bless, dim, pressure)
// Intervener: Direct interaction (whisper, manifest) - de-emphasized
export type PresenceMode = "observer" | "influencer" | "intervener";

export interface PresenceState {
  mode: PresenceMode;
  isActive: boolean;
  lastActionTick: number;
  cooldownUntil?: number; // Intervener mode has high cost
}

// World actions (non-command, interpretive)
export type WorldActionType =
  | "introduce_pressure"
  | "remove_support"
  | "amplify_signal"
  | "introduce_uncertainty";

export interface WorldAction {
  type: WorldActionType;
  intensity: number; // 0-1
  targetArea?: string; // optional area of effect
  description: string;
}

// Cultural/belief trends in the world
export interface CulturalTrend {
  id: string;
  worldId: string;
  name: string;
  type: "belief" | "movement" | "myth" | "crisis";
  strength: number; // 0-1
  participantCount: number;
  emergedAtTick: number;
  description: string;
}

// World feed item (what user sees in Observer mode)
export interface WorldFeedItem {
  id: string;
  worldId: string;
  tick: number;
  type: "citizen_post" | "cultural_shift" | "crisis" | "divine_event" | "social_interaction";
  citizenId?: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
