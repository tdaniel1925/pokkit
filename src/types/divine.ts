/**
 * Divine Types - Influencer Mode & Divine Inbox
 * Phase 2.5: Missing PRD features
 */

// ==============================================
// INFLUENCER MODE TYPES
// ==============================================

/**
 * Divine influence actions on posts/content
 * From PRD PROMPT 7: Bless (soft boost), Dim (soft suppress)
 */
export type DivineInfluenceType = "bless" | "dim";

/**
 * A divine influence action on a feed item
 */
export interface DivineInfluence {
  id: string;
  worldId: string;
  feedItemId: string;
  type: DivineInfluenceType;
  tick: number;

  // Effects
  visibilityModifier: number; // +0.1 to +0.3 for bless, -0.1 to -0.3 for dim
  beliefTrendImpact: number; // How much this affects belief trends

  // Citizen impact (citizens remember divine favor/disfavor, even if unconsciously)
  affectedCitizenIds: string[];
  memoryCreated: boolean;

  createdAt: Date;
}

/**
 * Input for creating a divine influence
 */
export interface DivineInfluenceInput {
  feedItemId: string;
  type: DivineInfluenceType;
}

/**
 * Result of applying divine influence
 */
export interface DivineInfluenceResult {
  success: boolean;
  influence?: DivineInfluence;

  // Effects on the world
  trendShifts: Array<{
    trendId: string;
    trendName: string;
    strengthChange: number;
  }>;

  // Citizen memories created
  memoriesCreated: number;

  // If citizens noticed (rare)
  citizensNoticed: string[];

  // Guardrail check
  passedGuardrails: boolean;
  guardrailWarnings?: string[];
}

// ==============================================
// DIVINE INBOX TYPES
// ==============================================

/**
 * Categories of divine inbox items
 */
export type InboxItemCategory =
  | "prayer"        // Direct appeal to divine
  | "question"      // Existential/theological question
  | "accusation"    // Blaming god for suffering
  | "praise"        // Gratitude/worship
  | "crisis_call"   // Desperate plea during crisis
  | "doubt"         // Expression of religious doubt
  | "testimony";    // Sharing divine experience with others

/**
 * Why this item surfaced to the inbox (filtering reason)
 */
export type InboxSurfaceReason =
  | "high_divinity_curiosity"  // Citizen has high curiosity about divinity
  | "crisis_related"           // Related to a crisis event
  | "direct_mention"           // Explicitly mentioned god/divine
  | "high_emotional_weight"    // Emotionally charged content
  | "belief_shift"             // Citizen is changing beliefs
  | "social_influence";        // Many citizens discussing same topic

/**
 * A divine inbox item - curated messages that surface to god
 */
export interface DivineInboxItem {
  id: string;
  worldId: string;
  citizenId: string;

  // Source reference
  sourceType: "post" | "thought" | "social_interaction";
  sourceId: string;

  // Content
  excerpt: string; // Shortened version for inbox view
  fullContent: string;
  category: InboxItemCategory;

  // Why this surfaced
  surfaceReasons: InboxSurfaceReason[];
  relevanceScore: number; // 0-1, higher = more relevant

  // Citizen context at time of creation
  citizenTrustInGod: number;
  citizenMood: number;
  citizenStress: number;

  // Status
  tick: number;
  seenAt?: Date;
  respondedAt?: Date;
  responseWhisperId?: string; // If god responded via whisper

  createdAt: Date;
}

/**
 * Filter options for divine inbox
 */
export interface InboxFilterOptions {
  categories?: InboxItemCategory[];
  unreadOnly?: boolean;
  minRelevance?: number;
  citizenId?: string;
  limit?: number;
}

/**
 * Inbox summary statistics
 */
export interface InboxSummary {
  total: number;
  unread: number;
  byCategory: Record<InboxItemCategory, number>;
  avgRelevance: number;
  oldestUnread?: Date;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Determines if a citizen's post should surface to the divine inbox
 */
export function shouldSurfaceToInbox(
  content: string,
  citizenState: {
    curiosityAboutDivinity: number;
    trustInGod: number;
    mood: number;
    stress: number;
  },
  worldContext: {
    recentCrisis: boolean;
    tick: number;
  }
): { shouldSurface: boolean; reasons: InboxSurfaceReason[]; relevance: number } {
  const reasons: InboxSurfaceReason[] = [];
  let relevance = 0;

  const lowerContent = content.toLowerCase();

  // Check for direct mentions
  const divineKeywords = [
    "god", "divine", "creator", "almighty", "heaven", "pray", "prayer",
    "blessing", "miracle", "faith", "believe", "holy", "sacred", "spirit",
    "why do you", "are you there", "hear me", "help me"
  ];

  const hasDivineMention = divineKeywords.some(kw => lowerContent.includes(kw));
  if (hasDivineMention) {
    reasons.push("direct_mention");
    relevance += 0.4;
  }

  // High curiosity about divinity
  if (citizenState.curiosityAboutDivinity > 0.6) {
    reasons.push("high_divinity_curiosity");
    relevance += 0.2 * citizenState.curiosityAboutDivinity;
  }

  // Crisis-related
  if (worldContext.recentCrisis && citizenState.stress > 0.5) {
    reasons.push("crisis_related");
    relevance += 0.3;
  }

  // High emotional weight (negative mood + high stress)
  if (citizenState.mood < -0.3 && citizenState.stress > 0.6) {
    reasons.push("high_emotional_weight");
    relevance += 0.2;
  }

  // Normalize relevance
  relevance = Math.min(relevance, 1);

  // Must have at least one reason and relevance > 0.2 to surface
  const shouldSurface = reasons.length > 0 && relevance > 0.2;

  return { shouldSurface, reasons, relevance };
}

/**
 * Categorizes inbox content
 */
export function categorizeInboxContent(content: string): InboxItemCategory {
  const lower = content.toLowerCase();

  // Prayer patterns
  if (lower.match(/please\s+(help|guide|save|protect)/i) || lower.includes("pray")) {
    return "prayer";
  }

  // Accusation patterns
  if (lower.match(/why (did|do) you|how could you|you (let|allowed)/i)) {
    return "accusation";
  }

  // Question patterns
  if (lower.match(/are you (real|there|listening)|do you (exist|care)|what is|why is/i)) {
    return "question";
  }

  // Crisis patterns
  if (lower.match(/help me|save us|desperate|dying|end of|no hope/i)) {
    return "crisis_call";
  }

  // Praise patterns
  if (lower.match(/thank you|grateful|blessed|praise|glory/i)) {
    return "praise";
  }

  // Doubt patterns
  if (lower.match(/doubt|unsure|maybe there is no|beginning to question/i)) {
    return "doubt";
  }

  // Testimony patterns (sharing experiences)
  if (lower.match(/i (felt|saw|heard|experienced)|it was like|a sign/i)) {
    return "testimony";
  }

  // Default to prayer (most common divine-directed content)
  return "prayer";
}
