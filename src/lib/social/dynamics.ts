/**
 * Social Dynamics Engine - Phase 2
 *
 * Handles relationships between citizens, social interactions,
 * and influence spreading through the social network.
 */

import { v4 as uuid } from "uuid";
import type {
  SocialInteraction,
  SocialInteractionType,
  SocialInfluence,
  RelationshipEvent,
} from "@/types/social";
import type { Citizen, CitizenRelationship, CitizenBelief } from "@/types/citizen";
import type { WorldState } from "@/types/world";

// ============================================
// RELATIONSHIP MANAGEMENT
// ============================================

export interface RelationshipFormationResult {
  formed: boolean;
  relationship?: CitizenRelationship;
  event?: RelationshipEvent;
  reason: string;
}

/**
 * Attempt to form a new relationship between two citizens
 */
export function formRelationship(
  citizen1: Citizen,
  citizen2: Citizen,
  tick: number,
  context: "random_encounter" | "shared_event" | "introduction" | "divine_nudge"
): RelationshipFormationResult {
  // Check if relationship already exists
  // (Caller should check this before calling)

  // Calculate compatibility
  const compatibility = calculateCompatibility(citizen1, citizen2);

  // Threshold for relationship formation
  const threshold = context === "divine_nudge" ? 0.2 : 0.4;

  if (compatibility < threshold) {
    return {
      formed: false,
      reason: `Compatibility too low (${compatibility.toFixed(2)} < ${threshold})`,
    };
  }

  // Determine relationship type based on compatibility and context
  const type = determineRelationshipType(compatibility, citizen1, citizen2);

  // Initial strength and trust based on compatibility
  const initialStrength = 0.2 + compatibility * 0.3;
  const initialTrust = compatibility * 0.5;

  const relationship: CitizenRelationship = {
    id: uuid(),
    citizenId: citizen1.id,
    targetCitizenId: citizen2.id,
    type,
    strength: initialStrength,
    trust: initialTrust,
    lastInteractionTick: tick,
  };

  const event: RelationshipEvent = {
    id: uuid(),
    relationshipId: relationship.id,
    type: "formed",
    newType: type,
    strengthChange: initialStrength,
    trustChange: initialTrust,
    cause: context === "divine_nudge" ? "divine_influence" : "interaction",
    tick,
    description: `${citizen1.name} and ${citizen2.name} formed a ${type} relationship`,
  };

  return {
    formed: true,
    relationship,
    event,
    reason: `Compatibility: ${compatibility.toFixed(2)}`,
  };
}

/**
 * Calculate compatibility between two citizens
 */
function calculateCompatibility(citizen1: Citizen, citizen2: Citizen): number {
  let score = 0.5; // Base compatibility

  // Similar personalities bond faster
  if (citizen1.attributes.personalityArchetype === citizen2.attributes.personalityArchetype) {
    score += 0.2;
  }

  // Complementary personalities can also work
  const complementaryPairs: [string, string][] = [
    ["idealist", "pragmatist"],
    ["believer", "seeker"],
    ["conformist", "rebel"],
  ];

  for (const [a, b] of complementaryPairs) {
    const p1 = citizen1.attributes.personalityArchetype;
    const p2 = citizen2.attributes.personalityArchetype;
    if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) {
      score += 0.15;
      break;
    }
  }

  // High social influence helps form connections
  const avgSocialInfluence =
    (citizen1.attributes.socialInfluencePotential +
      citizen2.attributes.socialInfluencePotential) /
    2;
  score += avgSocialInfluence * 0.2;

  // Similar trust in peers
  const trustDiff = Math.abs(citizen1.state.trustInPeers - citizen2.state.trustInPeers);
  score -= trustDiff * 0.2;

  // Opposing views on divinity can cause friction
  const divineTrustDiff = Math.abs(
    citizen1.state.trustInGod - citizen2.state.trustInGod
  );
  score -= divineTrustDiff * 0.15;

  // Stress reduces social openness
  const avgStress = (citizen1.state.stress + citizen2.state.stress) / 2;
  score -= avgStress * 0.15;

  return Math.max(0, Math.min(1, score));
}

/**
 * Determine relationship type based on context
 */
function determineRelationshipType(
  compatibility: number,
  citizen1: Citizen,
  citizen2: Citizen
): CitizenRelationship["type"] {
  if (compatibility > 0.7) {
    return "friend";
  } else if (compatibility > 0.5) {
    return "acquaintance";
  } else if (compatibility < 0.3) {
    return "rival";
  }
  return "acquaintance";
}

// ============================================
// RELATIONSHIP EVOLUTION
// ============================================

export interface RelationshipUpdateResult {
  relationship: CitizenRelationship;
  event?: RelationshipEvent;
  broken: boolean;
}

/**
 * Update a relationship based on an interaction
 */
export function updateRelationship(
  relationship: CitizenRelationship,
  interactionOutcome: "positive" | "negative" | "neutral",
  tick: number,
  cause: "interaction" | "divine_influence" | "crisis" | "time" | "betrayal"
): RelationshipUpdateResult {
  const strengthChange = calculateStrengthChange(interactionOutcome);
  const trustChange = calculateTrustChange(interactionOutcome, cause);

  const newStrength = Math.max(0, Math.min(1, relationship.strength + strengthChange));
  const newTrust = Math.max(-1, Math.min(1, relationship.trust + trustChange));

  // Check if relationship should transform or break
  let newType = relationship.type;
  let broken = false;
  let eventType: RelationshipEvent["type"] = strengthChange > 0 ? "strengthened" : "weakened";

  if (newStrength < 0.1) {
    broken = true;
    eventType = "broken";
  } else if (newTrust < -0.5 && relationship.type !== "enemy") {
    newType = "enemy";
    eventType = "transformed";
  } else if (newTrust > 0.7 && relationship.type === "acquaintance") {
    newType = "friend";
    eventType = "transformed";
  } else if (relationship.type === "friend" && newTrust < 0.2) {
    newType = "acquaintance";
    eventType = "transformed";
  }

  const updatedRelationship: CitizenRelationship = {
    ...relationship,
    strength: newStrength,
    trust: newTrust,
    type: newType,
    lastInteractionTick: tick,
  };

  const event: RelationshipEvent = {
    id: uuid(),
    relationshipId: relationship.id,
    type: eventType,
    oldType: eventType === "transformed" ? relationship.type : undefined,
    newType: eventType === "transformed" ? newType : undefined,
    strengthChange,
    trustChange,
    cause,
    tick,
    description: generateRelationshipEventDescription(eventType, relationship, cause),
  };

  return {
    relationship: updatedRelationship,
    event,
    broken,
  };
}

function calculateStrengthChange(outcome: "positive" | "negative" | "neutral"): number {
  switch (outcome) {
    case "positive":
      return 0.05 + Math.random() * 0.1;
    case "negative":
      return -0.1 - Math.random() * 0.1;
    case "neutral":
      return (Math.random() - 0.5) * 0.02;
  }
}

function calculateTrustChange(
  outcome: "positive" | "negative" | "neutral",
  cause: string
): number {
  let base = 0;
  switch (outcome) {
    case "positive":
      base = 0.05;
      break;
    case "negative":
      base = -0.1;
      break;
    case "neutral":
      base = 0;
      break;
  }

  // Betrayal causes massive trust damage
  if (cause === "betrayal") {
    base = -0.4;
  }

  return base + (Math.random() - 0.5) * 0.05;
}

function generateRelationshipEventDescription(
  eventType: RelationshipEvent["type"],
  relationship: CitizenRelationship,
  cause: string
): string {
  const descriptions: Record<RelationshipEvent["type"], string[]> = {
    formed: ["A new connection has formed"],
    strengthened: [
      "Their bond grows stronger",
      "They understand each other better now",
      "Time together has deepened their connection",
    ],
    weakened: [
      "Distance grows between them",
      "A rift has formed",
      "Their connection fades",
    ],
    broken: [
      "The relationship has ended",
      "They go their separate ways",
      "What was once there is now gone",
    ],
    transformed: [
      "Their relationship has changed fundamentally",
      "Things are different between them now",
      "A turning point in their relationship",
    ],
  };

  const options = descriptions[eventType];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================
// SOCIAL INTERACTIONS
// ============================================

export interface InteractionResult {
  interaction: SocialInteraction;
  outcomes: SocialInteraction["outcomes"];
  relationshipUpdates: RelationshipUpdateResult[];
  influenceAttempts: SocialInfluence[];
}

/**
 * Generate a social interaction between citizens
 */
export function generateInteraction(
  initiator: Citizen,
  participants: Citizen[],
  world: WorldState,
  type?: SocialInteractionType
): InteractionResult {
  // Determine interaction type if not provided
  const interactionType = type || selectInteractionType(initiator, participants);

  // Generate interaction content
  const content = generateInteractionContent(interactionType, initiator, participants);

  // Determine if there's a topic being discussed
  const topic = selectDiscussionTopic(interactionType, initiator, participants);

  // Calculate outcomes for each participant
  const outcomes = calculateInteractionOutcomes(
    interactionType,
    initiator,
    participants,
    topic
  );

  // Build the interaction record
  const interaction: SocialInteraction = {
    id: uuid(),
    worldId: world.id,
    tick: world.tick,
    type: interactionType,
    participants: [initiator.id, ...participants.map((p) => p.id)],
    initiatorId: initiator.id,
    content,
    topic,
    outcomes,
    visibility: determineVisibility(interactionType),
    createdAt: new Date(),
  };

  // Process relationship updates
  const relationshipUpdates: RelationshipUpdateResult[] = [];
  // (Caller handles relationship updates based on outcomes)

  // Process influence attempts
  const influenceAttempts = processInfluenceAttempts(
    interactionType,
    initiator,
    participants,
    topic,
    world
  );

  return {
    interaction,
    outcomes,
    relationshipUpdates,
    influenceAttempts,
  };
}

/**
 * Select appropriate interaction type based on context
 */
function selectInteractionType(
  initiator: Citizen,
  participants: Citizen[]
): SocialInteractionType {
  const { personalityArchetype } = initiator.attributes;
  const { mood, stress } = initiator.state;

  // Stressed citizens tend to conflict or seek support
  if (stress > 0.7) {
    return Math.random() > 0.5 ? "conflict" : "support";
  }

  // Low mood seeks support
  if (mood < -0.3) {
    return "support";
  }

  // Personality-based selection
  switch (personalityArchetype) {
    case "skeptic":
      return Math.random() > 0.5 ? "debate" : "conversation";
    case "believer":
      return Math.random() > 0.7 ? "ritual" : "conversation";
    case "idealist":
      return Math.random() > 0.6 ? "collaboration" : "conversation";
    case "rebel":
      return Math.random() > 0.4 ? "debate" : "gossip";
    case "conformist":
      return Math.random() > 0.7 ? "ritual" : "conversation";
    case "seeker":
      return Math.random() > 0.5 ? "teaching" : "conversation";
    case "cynic":
      return Math.random() > 0.5 ? "gossip" : "conversation";
    default:
      return "conversation";
  }
}

/**
 * Generate content for an interaction
 */
function generateInteractionContent(
  type: SocialInteractionType,
  initiator: Citizen,
  participants: Citizen[]
): string {
  const templates: Record<SocialInteractionType, string[]> = {
    conversation: [
      `${initiator.name} strikes up a conversation about daily life`,
      `A friendly chat begins between ${initiator.name} and others`,
      `${initiator.name} shares some thoughts with nearby citizens`,
    ],
    debate: [
      `${initiator.name} engages others in a spirited debate`,
      `A discussion about beliefs turns into a passionate exchange`,
      `${initiator.name} challenges the views of others`,
    ],
    support: [
      `${initiator.name} offers words of comfort`,
      `A moment of emotional support is shared`,
      `${initiator.name} listens and provides encouragement`,
    ],
    conflict: [
      `Tensions rise as ${initiator.name} confronts others`,
      `A disagreement escalates between citizens`,
      `${initiator.name} expresses frustration openly`,
    ],
    collaboration: [
      `${initiator.name} proposes working together on something`,
      `Citizens join forces for a common goal`,
      `A collaborative effort takes shape`,
    ],
    gossip: [
      `${initiator.name} shares some news about others`,
      `Whispered conversations spread through the group`,
      `Information travels from ear to ear`,
    ],
    teaching: [
      `${initiator.name} shares knowledge with others`,
      `A lesson is passed down through conversation`,
      `Wisdom flows from ${initiator.name} to willing listeners`,
    ],
    celebration: [
      `Joy fills the air as citizens celebrate together`,
      `${initiator.name} leads others in celebration`,
      `A moment of shared happiness unfolds`,
    ],
    mourning: [
      `Citizens gather to share in grief`,
      `${initiator.name} and others process loss together`,
      `A somber moment of collective mourning`,
    ],
    ritual: [
      `${initiator.name} participates in a ritual practice`,
      `Citizens engage in traditional observances`,
      `A sacred moment is shared among believers`,
    ],
  };

  const options = templates[type];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Select a topic for discussion based on interaction type
 */
function selectDiscussionTopic(
  type: SocialInteractionType,
  initiator: Citizen,
  participants: Citizen[]
): string | undefined {
  // Not all interactions have explicit topics
  if (!["debate", "teaching", "gossip", "ritual"].includes(type)) {
    return undefined;
  }

  const topics = [
    "nature_of_divinity",
    "meaning_of_life",
    "social_order",
    "morality",
    "future_hopes",
    "past_events",
    "leadership",
    "community",
  ];

  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Calculate outcomes for each participant
 */
function calculateInteractionOutcomes(
  type: SocialInteractionType,
  initiator: Citizen,
  participants: Citizen[],
  topic?: string
): SocialInteraction["outcomes"] {
  const allParticipants = [initiator, ...participants];

  return allParticipants.map((citizen) => {
    const isInitiator = citizen.id === initiator.id;

    // Base changes depend on interaction type
    const { moodChange, stressChange } = getBaseChanges(type, isInitiator);

    // Apply personality modifiers
    const finalMoodChange = moodChange * (0.8 + Math.random() * 0.4);
    const finalStressChange = stressChange * (0.8 + Math.random() * 0.4);

    return {
      citizenId: citizen.id,
      moodChange: finalMoodChange,
      stressChange: finalStressChange,
      trustChange: type === "support" ? 0.1 : type === "conflict" ? -0.1 : undefined,
      beliefInfluence: topic
        ? { topic, stanceChange: (Math.random() - 0.5) * 0.1 }
        : undefined,
    };
  });
}

function getBaseChanges(
  type: SocialInteractionType,
  isInitiator: boolean
): { moodChange: number; stressChange: number } {
  const changes: Record<
    SocialInteractionType,
    { moodChange: number; stressChange: number }
  > = {
    conversation: { moodChange: 0.05, stressChange: -0.05 },
    debate: { moodChange: 0, stressChange: 0.05 },
    support: { moodChange: 0.1, stressChange: -0.1 },
    conflict: { moodChange: -0.15, stressChange: 0.15 },
    collaboration: { moodChange: 0.1, stressChange: -0.05 },
    gossip: { moodChange: 0.02, stressChange: 0 },
    teaching: { moodChange: 0.05, stressChange: -0.02 },
    celebration: { moodChange: 0.2, stressChange: -0.1 },
    mourning: { moodChange: -0.1, stressChange: 0.05 },
    ritual: { moodChange: 0.05, stressChange: -0.05 },
  };

  return changes[type];
}

function determineVisibility(type: SocialInteractionType): "public" | "private" | "witnessed" {
  const publicTypes: SocialInteractionType[] = [
    "celebration",
    "ritual",
    "conflict",
    "collaboration",
  ];
  const privateTypes: SocialInteractionType[] = ["support", "gossip"];

  if (publicTypes.includes(type)) return "public";
  if (privateTypes.includes(type)) return "private";
  return "witnessed";
}

// ============================================
// SOCIAL INFLUENCE
// ============================================

/**
 * Process influence attempts during an interaction
 */
function processInfluenceAttempts(
  type: SocialInteractionType,
  initiator: Citizen,
  participants: Citizen[],
  topic: string | undefined,
  world: WorldState
): SocialInfluence[] {
  if (!topic) return [];

  // Not all interaction types involve influence
  if (!["debate", "teaching", "gossip", "conversation"].includes(type)) {
    return [];
  }

  const influences: SocialInfluence[] = [];

  // Initiator tries to influence participants
  for (const target of participants) {
    const result = attemptInfluence(initiator, target, topic, world);
    if (result) {
      influences.push(result);
    }
  }

  return influences;
}

/**
 * Attempt to influence a target citizen's beliefs
 */
export function attemptInfluence(
  influencer: Citizen,
  target: Citizen,
  topic: string,
  world: WorldState
): SocialInfluence | null {
  // Calculate influence strength
  const influenceStrength = calculateInfluenceStrength(influencer, target);

  // Determine method based on personalities
  const method = determineInfluenceMethod(influencer);

  // Calculate success probability
  const successProb = calculateInfluenceSuccess(influenceStrength, target, method);

  const wasSuccessful = Math.random() < successProb;

  // Calculate stance change if successful
  const targetStanceChange = wasSuccessful
    ? calculateStanceChange(influenceStrength, target)
    : 0;

  return {
    id: uuid(),
    worldId: world.id,
    influencerId: influencer.id,
    targetId: target.id,
    tick: world.tick,
    topic,
    influenceStrength,
    wasSuccessful,
    targetStanceChange,
    method,
  };
}

function calculateInfluenceStrength(influencer: Citizen, target: Citizen): number {
  let strength = influencer.attributes.socialInfluencePotential;

  // Trust relationship boosts influence
  // (Would need relationship data - using trust in peers as proxy)
  strength *= (target.state.trustInPeers + 1) / 2;

  // Emotional sensitivity affects receptivity
  strength *= 0.7 + target.attributes.emotionalSensitivity * 0.6;

  // Authority trust affects receptivity to influencers
  if (influencer.attributes.socialInfluencePotential > 0.6) {
    strength *= (target.attributes.authorityTrustBias + 1) / 2;
  }

  return Math.max(0, Math.min(1, strength));
}

function determineInfluenceMethod(
  influencer: Citizen
): SocialInfluence["method"] {
  const { personalityArchetype } = influencer.attributes;

  switch (personalityArchetype) {
    case "skeptic":
      return "argument";
    case "believer":
      return "example";
    case "idealist":
      return "charisma";
    case "rebel":
      return "pressure";
    case "pragmatist":
      return "evidence";
    default:
      return "argument";
  }
}

function calculateInfluenceSuccess(
  strength: number,
  target: Citizen,
  method: string
): number {
  let prob = strength * 0.5;

  // Method effectiveness varies by target personality
  const { personalityArchetype } = target.attributes;

  const methodEffectiveness: Record<string, Record<string, number>> = {
    argument: { skeptic: 0.7, pragmatist: 0.6, cynic: 0.4 },
    example: { believer: 0.8, seeker: 0.6, conformist: 0.7 },
    charisma: { idealist: 0.7, believer: 0.6, rebel: 0.3 },
    pressure: { conformist: 0.6, believer: 0.4, rebel: 0.2 },
    evidence: { pragmatist: 0.8, skeptic: 0.6, cynic: 0.5 },
  };

  const effectiveness =
    methodEffectiveness[method]?.[personalityArchetype] ?? 0.5;
  prob *= effectiveness;

  // Cognitive dissonance makes change harder
  prob *= 1 - target.state.cognitiveDissonance * 0.3;

  return Math.max(0.05, Math.min(0.9, prob));
}

function calculateStanceChange(strength: number, target: Citizen): number {
  // Base change proportional to influence strength
  let change = strength * 0.2;

  // Belief plasticity affects how much change occurs
  // (Would use world config - defaulting to 0.5)
  change *= 0.5;

  // Add some randomness
  change *= 0.7 + Math.random() * 0.6;

  // Cap the maximum change per interaction
  return Math.min(0.15, change);
}

// ============================================
// SOCIAL NETWORK ANALYSIS
// ============================================

/**
 * Find the most influential citizens in the world
 */
export function findInfluentialCitizens(
  citizens: Citizen[],
  relationships: CitizenRelationship[],
  limit: number = 5
): { citizen: Citizen; score: number }[] {
  const scores: Map<string, number> = new Map();

  for (const citizen of citizens) {
    let score = citizen.attributes.socialInfluencePotential;

    // Count relationships
    const relationshipCount = relationships.filter(
      (r) => r.citizenId === citizen.id || r.targetCitizenId === citizen.id
    ).length;
    score += relationshipCount * 0.1;

    // Strong relationships count more
    const strongRelationships = relationships.filter(
      (r) =>
        (r.citizenId === citizen.id || r.targetCitizenId === citizen.id) &&
        r.strength > 0.7
    ).length;
    score += strongRelationships * 0.2;

    scores.set(citizen.id, score);
  }

  return citizens
    .map((citizen) => ({ citizen, score: scores.get(citizen.id) || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find isolated citizens (few or no relationships)
 */
export function findIsolatedCitizens(
  citizens: Citizen[],
  relationships: CitizenRelationship[],
  threshold: number = 2
): Citizen[] {
  return citizens.filter((citizen) => {
    const connectionCount = relationships.filter(
      (r) => r.citizenId === citizen.id || r.targetCitizenId === citizen.id
    ).length;
    return connectionCount < threshold;
  });
}

/**
 * Calculate social cohesion score for the world
 */
export function calculateSocialCohesion(
  citizens: Citizen[],
  relationships: CitizenRelationship[]
): number {
  if (citizens.length < 2) return 1;

  // Calculate average trust and strength
  let totalTrust = 0;
  let totalStrength = 0;

  for (const r of relationships) {
    totalTrust += (r.trust + 1) / 2; // Normalize to 0-1
    totalStrength += r.strength;
  }

  const avgTrust = relationships.length > 0 ? totalTrust / relationships.length : 0.5;
  const avgStrength = relationships.length > 0 ? totalStrength / relationships.length : 0;

  // Connection density
  const maxPossibleRelationships = (citizens.length * (citizens.length - 1)) / 2;
  const density = relationships.length / maxPossibleRelationships;

  // Combine metrics
  const cohesion = avgTrust * 0.3 + avgStrength * 0.3 + density * 0.4;

  return Math.max(0, Math.min(1, cohesion));
}
