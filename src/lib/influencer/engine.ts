/**
 * Influencer Engine - Bless/Dim Actions
 * From PRD PROMPT 7: Influencer Mode
 *
 * "Bless" (soft boost) and "Dim" (soft suppress) actions on posts
 * Creates world events and citizen memories, subtly shifts belief trends
 */

import { checkGuardrails } from "@/lib/guardrails";
import type { GuardrailInput } from "@/types/guardrails";
import type { Citizen } from "@/types/citizen";
import type { WorldState, WorldFeedItem, CulturalTrend } from "@/types/world";
import type {
  DivineInfluence,
  DivineInfluenceType,
  DivineInfluenceInput,
  DivineInfluenceResult,
} from "@/types/divine";

/**
 * Calculate influence strength based on action type
 */
function calculateInfluenceStrength(type: DivineInfluenceType): {
  visibilityModifier: number;
  beliefTrendImpact: number;
} {
  // Bless gives positive modifiers, Dim gives negative
  // Keep effects subtle - this is "soft" influence
  if (type === "bless") {
    return {
      visibilityModifier: 0.15 + Math.random() * 0.15, // +0.15 to +0.30
      beliefTrendImpact: 0.05 + Math.random() * 0.05, // +0.05 to +0.10
    };
  } else {
    return {
      visibilityModifier: -(0.15 + Math.random() * 0.15), // -0.15 to -0.30
      beliefTrendImpact: -(0.03 + Math.random() * 0.03), // -0.03 to -0.06
    };
  }
}

/**
 * Determine which citizens are affected by influencing a feed item
 * - The author of the post
 * - Citizens who have interacted with similar content
 * - Random subset of general population (witnessed the divine favor/disfavor)
 */
function determineAffectedCitizens(
  feedItem: WorldFeedItem,
  allCitizens: Citizen[],
  maxAffected: number = 5
): string[] {
  const affected: string[] = [];

  // Always include the author if it's a citizen post
  if (feedItem.citizenId) {
    affected.push(feedItem.citizenId);
  }

  // Add some random citizens who "witnessed" the divine action
  // This simulates subtle community awareness
  const otherCitizens = allCitizens.filter(
    (c) => c.id !== feedItem.citizenId
  );

  const witnessCount = Math.min(
    Math.floor(Math.random() * 3) + 1, // 1-3 witnesses
    otherCitizens.length,
    maxAffected - affected.length
  );

  // Pick random witnesses
  const shuffled = [...otherCitizens].sort(() => Math.random() - 0.5);
  for (let i = 0; i < witnessCount; i++) {
    affected.push(shuffled[i].id);
  }

  return affected;
}

/**
 * Find trends related to this feed item's content
 */
function findRelatedTrends(
  feedItem: WorldFeedItem,
  trends: CulturalTrend[]
): CulturalTrend[] {
  const content = feedItem.content.toLowerCase();

  return trends.filter((trend) => {
    const trendName = trend.name.toLowerCase();
    const trendDesc = trend.description.toLowerCase();

    // Check if content mentions trend or vice versa
    return (
      content.includes(trendName) ||
      trendName.split(" ").some((word) => content.includes(word)) ||
      trendDesc.split(" ").some((word) => word.length > 4 && content.includes(word))
    );
  });
}

/**
 * Check if any citizen noticed the divine influence
 * Chance increases based on citizen's curiosity about divinity
 */
function checkIfCitizensNoticed(
  affectedCitizens: Citizen[]
): string[] {
  const noticed: string[] = [];

  for (const citizen of affectedCitizens) {
    // Base 5% chance, up to 20% for very curious citizens
    const noticeChance = 0.05 + citizen.attributes.curiosityAboutDivinity * 0.15;

    if (Math.random() < noticeChance) {
      noticed.push(citizen.id);
    }
  }

  return noticed;
}

/**
 * Apply a divine influence (Bless or Dim) to a feed item
 */
export async function applyDivineInfluence(
  input: DivineInfluenceInput,
  feedItem: WorldFeedItem,
  world: WorldState,
  allCitizens: Citizen[],
  trends: CulturalTrend[]
): Promise<DivineInfluenceResult> {
  // Check guardrails first - even bless/dim must pass safety checks
  const guardrailInput: GuardrailInput = {
    content: `${input.type} action on: ${feedItem.content}`,
    source: "god_action",
    context: {
      worldId: world.id,
      presenceMode: "influencer",
    },
  };

  const guardrailResult = await checkGuardrails(guardrailInput);

  if (!guardrailResult.passed) {
    return {
      success: false,
      passedGuardrails: false,
      guardrailWarnings: guardrailResult.warnings,
      trendShifts: [],
      memoriesCreated: 0,
      citizensNoticed: [],
    };
  }

  // Calculate influence strength
  const { visibilityModifier, beliefTrendImpact } = calculateInfluenceStrength(
    input.type
  );

  // Determine affected citizens
  const affectedCitizenIds = determineAffectedCitizens(feedItem, allCitizens);
  const affectedCitizens = allCitizens.filter((c) =>
    affectedCitizenIds.includes(c.id)
  );

  // Find and shift related trends
  const relatedTrends = findRelatedTrends(feedItem, trends);
  const trendShifts = relatedTrends.map((trend) => ({
    trendId: trend.id,
    trendName: trend.name,
    strengthChange: beliefTrendImpact,
  }));

  // Check if any citizens noticed
  const citizensNoticed = checkIfCitizensNoticed(affectedCitizens);

  // Create the influence record
  const influence: DivineInfluence = {
    id: crypto.randomUUID(),
    worldId: world.id,
    feedItemId: feedItem.id,
    type: input.type,
    tick: world.tick,
    visibilityModifier,
    beliefTrendImpact,
    affectedCitizenIds,
    memoryCreated: affectedCitizens.length > 0,
    createdAt: new Date(),
  };

  return {
    success: true,
    influence,
    trendShifts,
    memoriesCreated: affectedCitizens.length,
    citizensNoticed,
    passedGuardrails: true,
    guardrailWarnings: guardrailResult.warnings,
  };
}

/**
 * Get the action verb for influence type (for display/memory)
 */
export function getInfluenceVerb(type: DivineInfluenceType): string {
  return type === "bless" ? "blessed" : "dimmed";
}

/**
 * Generate memory content for a citizen who witnessed divine influence
 */
export function generateInfluenceMemory(
  type: DivineInfluenceType,
  feedItem: WorldFeedItem,
  noticed: boolean
): string {
  const excerpt =
    feedItem.content.length > 50
      ? feedItem.content.slice(0, 50) + "..."
      : feedItem.content;

  if (noticed) {
    // Citizen noticed something divine
    if (type === "bless") {
      return `I felt a strange warmth when I read "${excerpt}". Something about it felt... significant. Favored, even.`;
    } else {
      return `There was an odd feeling when I read "${excerpt}". It seemed to fade, become less important somehow.`;
    }
  } else {
    // Unconscious influence
    if (type === "bless") {
      return `The words "${excerpt}" stayed with me. I found myself thinking about them more than I expected.`;
    } else {
      return `I barely remember what "${excerpt}" was about. It just didn't seem to matter much.`;
    }
  }
}

/**
 * Check if an influence action is on cooldown
 * Prevents spam - can only bless/dim every few ticks
 */
export function isInfluenceOnCooldown(
  lastInfluenceTick: number | undefined,
  currentTick: number,
  cooldownTicks: number = 3
): boolean {
  if (lastInfluenceTick === undefined) return false;
  return currentTick - lastInfluenceTick < cooldownTicks;
}
