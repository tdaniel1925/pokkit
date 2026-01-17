/**
 * Cultural Emergence System - Phase 2
 *
 * Tracks and manages cultural movements, collective events,
 * and the evolution of society's beliefs and practices.
 */

import { v4 as uuid } from "uuid";
import type {
  CulturalMovement,
  MovementStage,
  CollectiveEvent,
} from "@/types/social";
import type { Citizen, CitizenBelief } from "@/types/citizen";
import type { WorldState, CulturalTrend } from "@/types/world";

// ============================================
// MOVEMENT DETECTION
// ============================================

export interface MovementDetectionResult {
  detected: boolean;
  movement?: CulturalMovement;
  reason: string;
}

/**
 * Detect if a new cultural movement is emerging
 * Based on shared beliefs reaching critical mass
 */
export function detectEmergingMovement(
  citizens: Citizen[],
  existingMovements: CulturalMovement[],
  world: WorldState
): MovementDetectionResult {
  // Find belief clusters
  const beliefClusters = findBeliefClusters(citizens);

  for (const cluster of beliefClusters) {
    // Check if this belief pattern already has a movement
    const existingMovement = existingMovements.find((m) =>
      m.coreBeliefs.some((b) => b.topic === cluster.topic)
    );

    if (existingMovement) continue;

    // Check if cluster is large enough to form movement
    const threshold = Math.max(3, citizens.length * 0.1);
    if (cluster.count < threshold) continue;

    // Check if beliefs are strong enough
    if (Math.abs(cluster.averageStance) < 0.5) continue;

    // A movement is forming!
    const founder = findMovementFounder(cluster.citizens);
    const movement = createMovement(cluster, founder, world);

    return {
      detected: true,
      movement,
      reason: `${cluster.count} citizens share strong ${cluster.topic} beliefs`,
    };
  }

  return {
    detected: false,
    reason: "No emerging movements detected",
  };
}

interface BeliefCluster {
  topic: string;
  averageStance: number;
  count: number;
  citizens: Citizen[];
}

/**
 * Find clusters of citizens with similar beliefs
 */
function findBeliefClusters(citizens: Citizen[]): BeliefCluster[] {
  const topicGroups: Map<string, { stances: number[]; citizens: Citizen[] }> = new Map();

  // Group by belief topics
  for (const citizen of citizens) {
    for (const belief of citizen.beliefs) {
      const existing = topicGroups.get(belief.topic);
      if (existing) {
        existing.stances.push(belief.stance);
        existing.citizens.push(citizen);
      } else {
        topicGroups.set(belief.topic, {
          stances: [belief.stance],
          citizens: [citizen],
        });
      }
    }
  }

  // Calculate clusters (citizens with similar stance on same topic)
  const clusters: BeliefCluster[] = [];

  for (const [topic, group] of Array.from(topicGroups.entries())) {
    // Find pro and anti clusters
    const proCitizens = group.citizens.filter((_, i) => group.stances[i] > 0.3);
    const antiCitizens = group.citizens.filter((_, i) => group.stances[i] < -0.3);

    if (proCitizens.length >= 3) {
      const proStances = group.stances.filter((s) => s > 0.3);
      clusters.push({
        topic,
        averageStance:
          proStances.reduce((a, b) => a + b, 0) / proStances.length,
        count: proCitizens.length,
        citizens: proCitizens,
      });
    }

    if (antiCitizens.length >= 3) {
      const antiStances = group.stances.filter((s) => s < -0.3);
      clusters.push({
        topic,
        averageStance:
          antiStances.reduce((a, b) => a + b, 0) / antiStances.length,
        count: antiCitizens.length,
        citizens: antiCitizens,
      });
    }
  }

  return clusters.sort((a, b) => b.count - a.count);
}

/**
 * Find the most suitable founder for a movement
 */
function findMovementFounder(citizens: Citizen[]): Citizen {
  // Prefer citizens with high social influence
  const sorted = [...citizens].sort(
    (a, b) =>
      b.attributes.socialInfluencePotential - a.attributes.socialInfluencePotential
  );
  return sorted[0];
}

/**
 * Create a new cultural movement
 */
function createMovement(
  cluster: BeliefCluster,
  founder: Citizen,
  world: WorldState
): CulturalMovement {
  const divineRelation = determineDevineRelation(cluster.topic, cluster.averageStance);
  const name = generateMovementName(cluster.topic, cluster.averageStance, divineRelation);

  return {
    id: uuid(),
    worldId: world.id,
    name,
    description: `A movement centered on ${cluster.topic}`,
    coreBeliefs: [{ topic: cluster.topic, stance: cluster.averageStance }],
    stage: "nascent",
    founderId: founder.id,
    leaderIds: [founder.id],
    followerIds: cluster.citizens.map((c) => c.id),
    influence: 0.1,
    divineRelation,
    emergedAtTick: world.tick,
    lastActivityTick: world.tick,
    history: [
      {
        tick: world.tick,
        event: `Movement founded by ${founder.name}`,
        stageChange: "nascent",
      },
    ],
  };
}

function determineDevineRelation(
  topic: string,
  stance: number
): CulturalMovement["divineRelation"] {
  const divineTopics = ["divine_trust", "nature_of_divinity", "god", "faith"];
  const isDivineTopic = divineTopics.some((t) => topic.toLowerCase().includes(t));

  if (isDivineTopic) {
    if (stance > 0.5) return "pro_divine";
    if (stance < -0.5) return "anti_divine";
    return "agnostic";
  }

  // Non-divine topics
  return "agnostic";
}

function generateMovementName(
  topic: string,
  stance: number,
  divineRelation: CulturalMovement["divineRelation"]
): string {
  const stanceWord = stance > 0 ? "Advocates" : "Skeptics";
  const topicWord = topic.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const prefixes = [
    "The",
    "United",
    "Free",
    "True",
    "New",
    "Awakened",
    "Enlightened",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  if (divineRelation === "pro_divine") {
    return `${prefix} Faithful of ${topicWord}`;
  } else if (divineRelation === "anti_divine") {
    return `${prefix} Secular ${stanceWord}`;
  }

  return `${prefix} ${topicWord} ${stanceWord}`;
}

// ============================================
// MOVEMENT EVOLUTION
// ============================================

export interface MovementUpdateResult {
  movement: CulturalMovement;
  stageChanged: boolean;
  newStage?: MovementStage;
  events: string[];
}

/**
 * Update a movement based on current conditions
 */
export function updateMovement(
  movement: CulturalMovement,
  citizens: Citizen[],
  world: WorldState
): MovementUpdateResult {
  const events: string[] = [];

  // Update follower count
  const newFollowers = findMovementFollowers(movement, citizens);
  const followerChange = newFollowers.length - movement.followerIds.length;

  if (followerChange !== 0) {
    events.push(
      followerChange > 0
        ? `Movement gained ${followerChange} followers`
        : `Movement lost ${Math.abs(followerChange)} followers`
    );
  }

  // Update influence based on followers and leaders
  const newInfluence = calculateMovementInfluence(
    newFollowers,
    movement.leaderIds,
    citizens
  );

  // Check for stage transition
  const { newStage, transitioned } = checkStageTransition(
    movement.stage,
    newFollowers.length,
    citizens.length,
    newInfluence
  );

  if (transitioned) {
    events.push(`Movement transitioned from ${movement.stage} to ${newStage}`);
  }

  // Update leader selection
  const newLeaders = selectMovementLeaders(newFollowers, movement);

  const updatedMovement: CulturalMovement = {
    ...movement,
    followerIds: newFollowers.map((c) => c.id),
    leaderIds: newLeaders,
    influence: newInfluence,
    stage: transitioned ? newStage! : movement.stage,
    lastActivityTick: world.tick,
    history: transitioned
      ? [
          ...movement.history,
          { tick: world.tick, event: `Stage: ${newStage}`, stageChange: newStage },
        ]
      : movement.history,
  };

  return {
    movement: updatedMovement,
    stageChanged: transitioned,
    newStage: transitioned ? newStage : undefined,
    events,
  };
}

/**
 * Find citizens who align with a movement's beliefs
 */
function findMovementFollowers(
  movement: CulturalMovement,
  citizens: Citizen[]
): Citizen[] {
  return citizens.filter((citizen) => {
    for (const coreBelief of movement.coreBeliefs) {
      const citizenBelief = citizen.beliefs.find((b) => b.topic === coreBelief.topic);
      if (!citizenBelief) continue;

      // Check if citizen's stance aligns (same sign and reasonably close)
      const sameDirection =
        (citizenBelief.stance > 0 && coreBelief.stance > 0) ||
        (citizenBelief.stance < 0 && coreBelief.stance < 0);

      if (sameDirection && Math.abs(citizenBelief.stance) > 0.3) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Calculate movement's influence in society
 */
function calculateMovementInfluence(
  followers: Citizen[],
  leaderIds: string[],
  allCitizens: Citizen[]
): number {
  if (allCitizens.length === 0) return 0;

  // Base influence from follower percentage
  let influence = followers.length / allCitizens.length;

  // Leaders' social influence boosts movement
  const leaders = followers.filter((f) => leaderIds.includes(f.id));
  const leaderInfluence = leaders.reduce(
    (sum, l) => sum + l.attributes.socialInfluencePotential,
    0
  );
  influence += leaderInfluence * 0.1;

  // Average conviction of followers
  const avgConviction = followers.reduce((sum, f) => {
    const relevantBeliefs = f.beliefs.filter((b) => Math.abs(b.stance) > 0.5);
    return sum + (relevantBeliefs.length > 0 ? relevantBeliefs[0].confidence : 0.5);
  }, 0) / (followers.length || 1);
  influence *= 0.5 + avgConviction * 0.5;

  return Math.max(0, Math.min(1, influence));
}

/**
 * Check if movement should transition to a new stage
 */
function checkStageTransition(
  currentStage: MovementStage,
  followerCount: number,
  totalPopulation: number,
  influence: number
): { newStage?: MovementStage; transitioned: boolean } {
  const percentage = followerCount / totalPopulation;

  const transitions: Record<MovementStage, { next: MovementStage; condition: boolean }[]> = {
    nascent: [{ next: "growing", condition: percentage > 0.15 && influence > 0.1 }],
    growing: [
      { next: "mainstream", condition: percentage > 0.35 && influence > 0.25 },
      { next: "declining", condition: percentage < 0.1 },
    ],
    mainstream: [
      { next: "dominant", condition: percentage > 0.6 && influence > 0.5 },
      { next: "declining", condition: percentage < 0.25 },
    ],
    dominant: [{ next: "declining", condition: percentage < 0.4 }],
    declining: [
      { next: "growing", condition: percentage > 0.2 && influence > 0.15 },
      { next: "underground", condition: percentage < 0.05 },
      { next: "extinct", condition: followerCount < 2 },
    ],
    underground: [
      { next: "growing", condition: percentage > 0.1 && influence > 0.1 },
      { next: "extinct", condition: followerCount < 2 },
    ],
    extinct: [], // Cannot transition from extinct
  };

  const possibleTransitions = transitions[currentStage];
  for (const t of possibleTransitions) {
    if (t.condition) {
      return { newStage: t.next, transitioned: true };
    }
  }

  return { transitioned: false };
}

/**
 * Select leaders for a movement
 */
function selectMovementLeaders(
  followers: Citizen[],
  movement: CulturalMovement
): string[] {
  // Sort by social influence
  const sorted = [...followers].sort(
    (a, b) =>
      b.attributes.socialInfluencePotential - a.attributes.socialInfluencePotential
  );

  // Keep existing leaders if they're still followers
  const existingLeaders = movement.leaderIds.filter((id) =>
    followers.some((f) => f.id === id)
  );

  // Add new leaders from top influencers
  const newLeaderCount = Math.min(3, Math.ceil(followers.length / 10));
  const allLeaders = new Set(existingLeaders);

  for (const citizen of sorted) {
    if (allLeaders.size >= newLeaderCount) break;
    allLeaders.add(citizen.id);
  }

  return Array.from(allLeaders);
}

// ============================================
// COLLECTIVE EVENTS
// ============================================

export interface CollectiveEventResult {
  event: CollectiveEvent;
  citizenUpdates: Map<string, Partial<Citizen["state"]>>;
  worldUpdates: {
    stabilityChange: number;
    entropyChange: number;
  };
}

/**
 * Generate a collective event affecting multiple citizens
 */
export function generateCollectiveEvent(
  type: CollectiveEvent["type"],
  affectedCitizens: Citizen[],
  world: WorldState,
  movement?: CulturalMovement,
  isDivine: boolean = false
): CollectiveEventResult {
  const { name, description } = generateEventDetails(type, movement);

  // Calculate outcomes
  const outcomes = calculateCollectiveOutcomes(type, affectedCitizens);

  // Calculate individual citizen updates
  const citizenUpdates = calculateCitizenUpdates(type, affectedCitizens);

  const event: CollectiveEvent = {
    id: uuid(),
    worldId: world.id,
    tick: world.tick,
    type,
    name,
    description,
    affectedCitizenIds: affectedCitizens.map((c) => c.id),
    movementId: movement?.id,
    divinelyInfluenced: isDivine,
    outcomes,
    createdAt: new Date(),
  };

  return {
    event,
    citizenUpdates,
    worldUpdates: {
      stabilityChange: outcomes.worldStabilityChange,
      entropyChange: outcomes.culturalEntropyChange,
    },
  };
}

function generateEventDetails(
  type: CollectiveEvent["type"],
  movement?: CulturalMovement
): { name: string; description: string } {
  const templates: Record<CollectiveEvent["type"], { names: string[]; descriptions: string[] }> = {
    celebration: {
      names: ["Festival of Unity", "Day of Joy", "Harvest Celebration", "Spring Festival"],
      descriptions: ["Citizens gather to celebrate together", "A joyous occasion brings the community together"],
    },
    crisis: {
      names: ["Time of Hardship", "The Great Challenge", "Dark Days", "Trial Period"],
      descriptions: ["Difficult times test the community", "Citizens face adversity together"],
    },
    disaster: {
      names: ["The Calamity", "Natural Disaster", "Great Loss", "Catastrophe"],
      descriptions: ["Tragedy strikes the community", "A devastating event shakes the world"],
    },
    miracle: {
      names: ["Divine Sign", "The Wonder", "Inexplicable Occurrence", "Sacred Event"],
      descriptions: ["Something extraordinary happens", "An event defying explanation occurs"],
    },
    revelation: {
      names: ["The Awakening", "Truth Unveiled", "Great Discovery", "Moment of Clarity"],
      descriptions: ["A profound truth is revealed", "Understanding dawns on the community"],
    },
    schism: {
      names: ["The Division", "Great Split", "Parting of Ways", "Ideological Break"],
      descriptions: ["The community divides over beliefs", "Irreconcilable differences emerge"],
    },
    reform: {
      names: ["New Beginning", "The Reformation", "Social Change", "Era of Reform"],
      descriptions: ["Society transforms itself", "Old ways give way to new"],
    },
  };

  const template = templates[type];
  const name = template.names[Math.floor(Math.random() * template.names.length)];
  const desc = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];

  return {
    name: movement ? `${movement.name}: ${name}` : name,
    description: desc,
  };
}

function calculateCollectiveOutcomes(
  type: CollectiveEvent["type"],
  citizens: Citizen[]
): CollectiveEvent["outcomes"] {
  const impacts: Record<
    CollectiveEvent["type"],
    {
      stability: number;
      entropy: number;
      mood: number;
      hope: number;
    }
  > = {
    celebration: { stability: 0.1, entropy: -0.05, mood: 0.2, hope: 0.1 },
    crisis: { stability: -0.15, entropy: 0.1, mood: -0.15, hope: -0.1 },
    disaster: { stability: -0.25, entropy: 0.15, mood: -0.25, hope: -0.2 },
    miracle: { stability: 0.05, entropy: 0.1, mood: 0.15, hope: 0.2 },
    revelation: { stability: 0, entropy: 0.1, mood: 0.05, hope: 0.1 },
    schism: { stability: -0.2, entropy: 0.2, mood: -0.1, hope: -0.1 },
    reform: { stability: -0.1, entropy: 0.1, mood: 0.05, hope: 0.15 },
  };

  const impact = impacts[type];

  return {
    worldStabilityChange: impact.stability,
    culturalEntropyChange: impact.entropy,
    averageMoodChange: impact.mood,
    averageHopeChange: impact.hope,
    beliefShifts: [], // Would be filled based on event specifics
  };
}

function calculateCitizenUpdates(
  type: CollectiveEvent["type"],
  citizens: Citizen[]
): Map<string, Partial<Citizen["state"]>> {
  const updates = new Map<string, Partial<Citizen["state"]>>();
  const impacts: Record<
    CollectiveEvent["type"],
    { mood: number; stress: number; hope: number }
  > = {
    celebration: { mood: 0.15, stress: -0.1, hope: 0.1 },
    crisis: { mood: -0.1, stress: 0.2, hope: -0.1 },
    disaster: { mood: -0.2, stress: 0.3, hope: -0.15 },
    miracle: { mood: 0.1, stress: -0.1, hope: 0.15 },
    revelation: { mood: 0.05, stress: 0.05, hope: 0.1 },
    schism: { mood: -0.05, stress: 0.15, hope: -0.05 },
    reform: { mood: 0.05, stress: 0.1, hope: 0.1 },
  };

  const impact = impacts[type];

  for (const citizen of citizens) {
    // Apply base impact with personality modifier
    const sensitivity = citizen.attributes.emotionalSensitivity;
    const modifier = 0.7 + sensitivity * 0.6;

    updates.set(citizen.id, {
      mood: Math.max(-1, Math.min(1, citizen.state.mood + impact.mood * modifier)),
      stress: Math.max(0, Math.min(1, citizen.state.stress + impact.stress * modifier)),
      hope: Math.max(0, Math.min(1, citizen.state.hope + impact.hope * modifier)),
    });
  }

  return updates;
}

// ============================================
// CULTURAL TREND TRACKING
// ============================================

/**
 * Update cultural trends based on citizen beliefs
 */
export function updateCulturalTrends(
  existingTrends: CulturalTrend[],
  citizens: Citizen[],
  world: WorldState
): CulturalTrend[] {
  const beliefClusters = findBeliefClusters(citizens);
  const updatedTrends: CulturalTrend[] = [];

  // Update existing trends
  for (const trend of existingTrends) {
    const matchingCluster = beliefClusters.find((c) => c.topic === trend.name);

    if (matchingCluster) {
      updatedTrends.push({
        ...trend,
        strength: Math.min(1, matchingCluster.count / citizens.length),
        participantCount: matchingCluster.count,
      });
    } else {
      // Trend is declining
      const newStrength = trend.strength * 0.9;
      if (newStrength > 0.1) {
        updatedTrends.push({
          ...trend,
          strength: newStrength,
          participantCount: Math.floor(trend.participantCount * 0.9),
        });
      }
    }
  }

  // Add new trends from clusters that aren't tracked
  for (const cluster of beliefClusters) {
    const alreadyTracked = updatedTrends.some((t) => t.name === cluster.topic);
    if (!alreadyTracked && cluster.count >= citizens.length * 0.1) {
      updatedTrends.push({
        id: uuid(),
        worldId: world.id,
        name: cluster.topic,
        type: "belief",
        strength: cluster.count / citizens.length,
        participantCount: cluster.count,
        emergedAtTick: world.tick,
        description: `Growing interest in ${cluster.topic}`,
      });
    }
  }

  return updatedTrends;
}
