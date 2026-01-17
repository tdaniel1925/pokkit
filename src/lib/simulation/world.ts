/**
 * POKKIT World Management
 *
 * Functions for creating, loading, and managing worlds.
 */

import type { WorldConfig, WorldState, PresenceMode } from "@/types/world";
import type { Citizen } from "@/types/citizen";
import { v4 as uuid } from "uuid";
import { generatePopulation } from "@/lib/ai/citizen";

/**
 * Create a new world with the given configuration
 */
export function createWorld(userId: string, config: WorldConfig): WorldState {
  return {
    id: uuid(),
    userId,
    config,
    tick: 0,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Initialize a world with its starting population
 */
export function initializeWorld(
  world: WorldState
): { world: WorldState; citizens: Citizen[] } {
  const citizens = generatePopulation(world.id, world.config.populationSize, 0);

  return {
    world: {
      ...world,
      updatedAt: new Date(),
    },
    citizens,
  };
}

/**
 * Default world configuration
 */
export function getDefaultWorldConfig(name: string): WorldConfig {
  return {
    name,
    populationSize: 25,
    culturalEntropy: 0.5,
    beliefPlasticity: 0.5,
    crisisFrequency: 0.3,
    authoritySkepticismIndex: 0.5,
  };
}

/**
 * Validate world configuration
 */
export function validateWorldConfig(config: Partial<WorldConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.name || config.name.length < 1) {
    errors.push("World name is required");
  }
  if (config.name && config.name.length > 100) {
    errors.push("World name must be 100 characters or less");
  }
  if (config.populationSize !== undefined) {
    if (config.populationSize < 5) errors.push("Population must be at least 5");
    if (config.populationSize > 1000) errors.push("Population cannot exceed 1000");
  }

  const rangeFields = [
    "culturalEntropy",
    "beliefPlasticity",
    "crisisFrequency",
    "authoritySkepticismIndex",
  ] as const;

  for (const field of rangeFields) {
    const value = config[field];
    if (value !== undefined && (value < 0 || value > 1)) {
      errors.push(`${field} must be between 0 and 1`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a presence mode is available
 * Modes: observer, influencer, intervener
 */
export function isPresenceModeAvailable(
  mode: PresenceMode,
  world: WorldState,
  currentTick: number
): { available: boolean; reason?: string } {
  // Observer is always available
  if (mode === "observer") {
    return { available: true };
  }

  // Influencer - subtle environmental nudges
  if (mode === "influencer") {
    return { available: true };
  }

  // Intervener - direct interaction (whisper, manifest)
  // Available but de-emphasized
  if (mode === "intervener") {
    return { available: true };
  }

  return { available: false, reason: "Unknown presence mode" };
}

/**
 * Calculate world stability index
 */
export function calculateWorldStability(citizens: Citizen[]): number {
  if (citizens.length === 0) return 1;

  // Factors that affect stability
  const avgStress =
    citizens.reduce((sum, c) => sum + c.state.stress, 0) / citizens.length;
  const avgDissonance =
    citizens.reduce((sum, c) => sum + c.state.cognitiveDissonance, 0) / citizens.length;
  const avgTrustPeers =
    citizens.reduce((sum, c) => sum + c.state.trustInPeers, 0) / citizens.length;

  // Stability decreases with stress and dissonance, increases with peer trust
  const stability = 1 - avgStress * 0.3 - avgDissonance * 0.3 + avgTrustPeers * 0.2;

  return Math.max(0, Math.min(1, stability));
}

/**
 * Get world summary statistics
 */
export function getWorldSummary(world: WorldState, citizens: Citizen[]): {
  stability: number;
  avgMood: number;
  avgHope: number;
  avgTrustInGod: number;
  populationHealth: "thriving" | "stable" | "struggling" | "crisis";
} {
  if (citizens.length === 0) {
    return {
      stability: 1,
      avgMood: 0,
      avgHope: 0.5,
      avgTrustInGod: 0,
      populationHealth: "stable",
    };
  }

  const avgMood = citizens.reduce((sum, c) => sum + c.state.mood, 0) / citizens.length;
  const avgHope = citizens.reduce((sum, c) => sum + c.state.hope, 0) / citizens.length;
  const avgTrustInGod =
    citizens.reduce((sum, c) => sum + c.state.trustInGod, 0) / citizens.length;
  const stability = calculateWorldStability(citizens);

  let populationHealth: "thriving" | "stable" | "struggling" | "crisis";
  if (avgMood > 0.5 && avgHope > 0.6 && stability > 0.7) {
    populationHealth = "thriving";
  } else if (avgMood > 0 && avgHope > 0.3 && stability > 0.5) {
    populationHealth = "stable";
  } else if (stability > 0.3) {
    populationHealth = "struggling";
  } else {
    populationHealth = "crisis";
  }

  return {
    stability,
    avgMood,
    avgHope,
    avgTrustInGod,
    populationHealth,
  };
}
