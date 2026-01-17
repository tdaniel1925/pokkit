/**
 * POKKIT World Simulation Engine
 *
 * The core engine that drives world evolution.
 * Processes simulation ticks, manages citizens, and handles events.
 *
 * Architecture:
 * - Tick-based simulation
 * - Autonomous citizen behavior
 * - Cultural evolution
 * - Divine intervention processing
 */

import type { WorldState, WorldFeedItem, CulturalTrend } from "@/types/world";
import type { Citizen, CitizenPost, CitizenMemory } from "@/types/citizen";
import type { DivineAction, GuardrailCheckResult } from "@/types/guardrails";
import { v4 as uuid } from "uuid";
import {
  generateCitizenAction,
  updateCitizenState,
  processMemoryDecay,
  pruneMemories,
} from "@/lib/ai/citizen";
import { checkDivineAction } from "@/lib/guardrails";

export interface SimulationTickResult {
  worldState: WorldState;
  newFeedItems: WorldFeedItem[];
  citizenUpdates: Map<string, Partial<Citizen>>;
  culturalChanges: CulturalTrend[];
  divineActionResult?: {
    action: DivineAction;
    guardrailResult: GuardrailCheckResult;
    success: boolean;
  };
}

export interface SimulationContext {
  world: WorldState;
  citizens: Citizen[];
  memories: Map<string, CitizenMemory[]>;
  pendingDivineAction?: DivineAction;
}

/**
 * Process a single simulation tick
 */
export async function processSimulationTick(
  context: SimulationContext
): Promise<SimulationTickResult> {
  const { world, citizens, memories, pendingDivineAction } = context;

  const newFeedItems: WorldFeedItem[] = [];
  const citizenUpdates = new Map<string, Partial<Citizen>>();
  const culturalChanges: CulturalTrend[] = [];
  let divineActionResult: SimulationTickResult["divineActionResult"];

  // Increment tick
  const newWorldState: WorldState = {
    ...world,
    tick: world.tick + 1,
    updatedAt: new Date(),
  };

  // Process divine action first (if any)
  if (pendingDivineAction) {
    divineActionResult = await processDivineAction(
      pendingDivineAction,
      citizens,
      world
    );

    if (divineActionResult.success) {
      // Create feed item for divine event
      newFeedItems.push({
        id: uuid(),
        worldId: world.id,
        tick: newWorldState.tick,
        type: "divine_event",
        citizenId: pendingDivineAction.targetCitizenId,
        content: describeDivineEvent(pendingDivineAction),
        metadata: { action: pendingDivineAction },
        createdAt: new Date(),
      });
    }
  }

  // Process citizen actions (subset each tick for performance)
  const activeCitizens = selectActiveCitizens(citizens, world.config.populationSize);

  for (const citizen of activeCitizens) {
    const citizenMemories = memories.get(citizen.id) || [];

    // Generate autonomous action
    const post = await generateCitizenAction(citizen, citizenMemories, world);

    if (post) {
      // Add to feed
      newFeedItems.push({
        id: uuid(),
        worldId: world.id,
        tick: newWorldState.tick,
        type: "citizen_post",
        citizenId: citizen.id,
        content: post.content,
        metadata: { postType: post.type },
        createdAt: new Date(),
      });

      // Update citizen state based on action
      const eventType = determineEventType(post);
      const newState = updateCitizenState(citizen.state, {
        type: eventType,
        intensity: 0.3,
      });

      citizenUpdates.set(citizen.id, {
        state: newState,
        lastActiveTick: newWorldState.tick,
      });
    }

    // Process memory decay
    const processedMemories = processMemoryDecay(citizenMemories, newWorldState.tick);
    const prunedMemories = pruneMemories(processedMemories);
    // Note: Memory updates would be handled by the caller
  }

  // Check for cultural emergence
  const culturalEvent = checkCulturalEmergence(citizens, newWorldState);
  if (culturalEvent) {
    culturalChanges.push(culturalEvent);
    newFeedItems.push({
      id: uuid(),
      worldId: world.id,
      tick: newWorldState.tick,
      type: "cultural_shift",
      content: culturalEvent.description,
      metadata: { trend: culturalEvent },
      createdAt: new Date(),
    });
  }

  // Check for world end conditions
  const endState = checkWorldEndConditions(citizens, newWorldState);
  if (endState) {
    newWorldState.status = "ended";
    newWorldState.endState = endState;
  }

  return {
    worldState: newWorldState,
    newFeedItems,
    citizenUpdates,
    culturalChanges,
    divineActionResult,
  };
}

/**
 * Process a divine action through guardrails
 */
async function processDivineAction(
  action: DivineAction,
  citizens: Citizen[],
  world: WorldState
): Promise<NonNullable<SimulationTickResult["divineActionResult"]>> {
  const targetCitizen = action.targetCitizenId
    ? citizens.find((c) => c.id === action.targetCitizenId) || null
    : null;

  const { guardrailResult, consentResult, updatedCitizenState } = await checkDivineAction(
    action,
    targetCitizen,
    world.id,
    world.tick
  );

  return {
    action,
    guardrailResult,
    success: guardrailResult.passed && (!consentResult || !consentResult.violated),
  };
}

/**
 * Select which citizens are active this tick
 */
function selectActiveCitizens(citizens: Citizen[], maxActive: number): Citizen[] {
  // Randomly select a subset for processing
  const activeCount = Math.min(Math.ceil(citizens.length * 0.2), maxActive, 10);
  const shuffled = [...citizens].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, activeCount);
}

/**
 * Determine event type from a citizen post
 */
function determineEventType(post: CitizenPost): "positive" | "negative" | "neutral" {
  const content = post.content.toLowerCase();

  // Simple sentiment heuristics
  const positiveWords = ["happy", "hope", "joy", "love", "grateful", "peace", "good"];
  const negativeWords = ["sad", "fear", "hate", "pain", "suffer", "angry", "lost"];

  const positiveCount = positiveWords.filter((w) => content.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => content.includes(w)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Describe a divine event for the feed
 */
function describeDivineEvent(action: DivineAction): string {
  switch (action.type) {
    case "boost":
      return "A subtle warmth spreads through the world, uplifting spirits.";
    case "suppress":
      return "A quiet stillness descends, dampening certain energies.";
    case "environmental_nudge":
      return "The environment shifts subtly, as if guided by unseen forces.";
    case "whisper":
      return "Someone receives a message that feels otherworldly.";
    case "manifest":
      return "The divine presence makes itself known, undeniably.";
    default:
      return "Something divine stirs in the world.";
  }
}

/**
 * Check for cultural emergence (new movements, beliefs, etc.)
 */
function checkCulturalEmergence(
  citizens: Citizen[],
  world: WorldState
): CulturalTrend | null {
  // Check if enough citizens share a belief strongly
  const beliefCounts = new Map<string, number>();

  for (const citizen of citizens) {
    for (const belief of citizen.beliefs) {
      if (belief.confidence > 0.7 && Math.abs(belief.stance) > 0.6) {
        const key = `${belief.topic}_${belief.stance > 0 ? "for" : "against"}`;
        beliefCounts.set(key, (beliefCounts.get(key) || 0) + 1);
      }
    }
  }

  // If significant portion shares a belief, create trend
  const threshold = citizens.length * 0.3;
  for (const [key, count] of Array.from(beliefCounts.entries())) {
    if (count >= threshold && Math.random() < 0.1) {
      // 10% chance to manifest as trend
      const [topic, stance] = key.split("_");
      return {
        id: uuid(),
        worldId: world.id,
        name: `${stance === "for" ? "Pro" : "Anti"}-${formatTopic(topic)} Movement`,
        type: "movement",
        strength: count / citizens.length,
        participantCount: count,
        emergedAtTick: world.tick,
        description: `A significant portion of the population has aligned on views about ${formatTopic(topic)}.`,
      };
    }
  }

  return null;
}

function formatTopic(topic: string): string {
  return topic
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Check if world has reached an end state
 */
function checkWorldEndConditions(
  citizens: Citizen[],
  world: WorldState
): WorldState["endState"] {
  // God irrelevant: Very low average trust in god
  const avgTrustInGod =
    citizens.reduce((sum, c) => sum + c.state.trustInGod, 0) / citizens.length;
  if (avgTrustInGod < -0.7 && world.tick > 100) {
    return "god_irrelevant";
  }

  // Society transcends: High hope, low stress, moderate/low divine interest
  const avgHope = citizens.reduce((sum, c) => sum + c.state.hope, 0) / citizens.length;
  const avgStress = citizens.reduce((sum, c) => sum + c.state.stress, 0) / citizens.length;
  if (avgHope > 0.8 && avgStress < 0.2 && avgTrustInGod < 0.3 && world.tick > 200) {
    return "society_transcends";
  }

  // Cultural fragmentation: High cognitive dissonance, low trust in peers
  const avgDissonance =
    citizens.reduce((sum, c) => sum + c.state.cognitiveDissonance, 0) / citizens.length;
  const avgTrustPeers =
    citizens.reduce((sum, c) => sum + c.state.trustInPeers, 0) / citizens.length;
  if (avgDissonance > 0.7 && avgTrustPeers < 0.3 && world.tick > 150) {
    return "cultural_fragmentation";
  }

  return undefined;
}
