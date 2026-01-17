import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const worldStatusEnum = pgEnum("world_status", ["active", "paused", "ended"]);
export const worldEndStateEnum = pgEnum("world_end_state", [
  "god_irrelevant",
  "society_transcends",
  "god_withdraws",
  "cultural_fragmentation",
  "eternal_ambiguity",
]);
export const presenceModeEnum = pgEnum("presence_mode", [
  "observer",
  "influencer",
  "whisperer",
  "manifest",
]);
export const memoryTypeEnum = pgEnum("memory_type", [
  "short_term",
  "long_term",
  "divine_interaction",
]);
export const feedItemTypeEnum = pgEnum("feed_item_type", [
  "citizen_post",
  "cultural_shift",
  "crisis",
  "divine_event",
  "social_interaction",
]);

// Phase 2 enums
export const whisperToneEnum = pgEnum("whisper_tone", [
  "gentle",
  "urgent",
  "questioning",
  "comforting",
  "warning",
  "mysterious",
]);

export const whisperReceptionEnum = pgEnum("whisper_reception", [
  "accepted",
  "questioned",
  "ignored",
  "resisted",
  "misinterpreted",
  "shared",
]);

export const socialInteractionTypeEnum = pgEnum("social_interaction_type", [
  "conversation",
  "debate",
  "support",
  "conflict",
  "collaboration",
  "gossip",
  "teaching",
  "celebration",
  "mourning",
  "ritual",
]);

export const movementStageEnum = pgEnum("movement_stage", [
  "nascent",
  "growing",
  "mainstream",
  "dominant",
  "declining",
  "underground",
  "extinct",
]);

export const relationshipEventTypeEnum = pgEnum("relationship_event_type", [
  "formed",
  "strengthened",
  "weakened",
  "broken",
  "transformed",
]);

export const collectiveEventTypeEnum = pgEnum("collective_event_type", [
  "celebration",
  "crisis",
  "disaster",
  "miracle",
  "revelation",
  "schism",
  "reform",
]);

// Phase 2.5 enums: Influencer Mode & Divine Inbox
export const divineInfluenceTypeEnum = pgEnum("divine_influence_type", [
  "bless",
  "dim",
]);

export const inboxItemCategoryEnum = pgEnum("inbox_item_category", [
  "prayer",
  "question",
  "accusation",
  "praise",
  "crisis_call",
  "doubt",
  "testimony",
]);

export const inboxSourceTypeEnum = pgEnum("inbox_source_type", [
  "post",
  "thought",
  "social_interaction",
]);

export const safetyFlagSeverityEnum = pgEnum("safety_flag_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const safetyFlagCategoryEnum = pgEnum("safety_flag_category", [
  "self_harm",
  "violence",
  "coercion",
  "abuse",
  "other",
]);

// Phase 3 enums: Manifest Mode
export const revelationTypeEnum = pgEnum("revelation_type", [
  "proclamation",
  "sign",
  "visitation",
  "prophecy",
  "judgment",
  "blessing",
  "warning",
]);

export const manifestIntensityEnum = pgEnum("manifest_intensity", [
  "subtle",
  "notable",
  "undeniable",
  "overwhelming",
]);

export const manifestReactionTypeEnum = pgEnum("manifest_reaction_type", [
  "worship",
  "awe",
  "fear",
  "denial",
  "skepticism",
  "anger",
  "ecstasy",
  "despair",
]);

export const instabilityTrendEnum = pgEnum("instability_trend", [
  "stable",
  "rising",
  "falling",
  "critical",
]);

// Worlds table
export const worlds = pgTable("worlds", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull(), // WorldConfig
  tick: integer("tick").notNull().default(0),
  status: worldStatusEnum("status").notNull().default("active"),
  endState: worldEndStateEnum("end_state"),
  presenceMode: presenceModeEnum("presence_mode").notNull().default("observer"),
  presenceLastActionTick: integer("presence_last_action_tick").default(0),
  manifestCooldownUntil: integer("manifest_cooldown_until"),
  // Phase 3: Instability tracking
  instability: real("instability").notNull().default(0), // 0 to 1
  instabilityTrend: instabilityTrendEnum("instability_trend").notNull().default("stable"),
  lastManifestTick: integer("last_manifest_tick"),
  manifestCount: integer("manifest_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Citizens table
export const citizens = pgTable("citizens", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  attributes: jsonb("attributes").notNull(), // CitizenAttributes
  state: jsonb("state").notNull(), // CitizenDynamicState
  consent: jsonb("consent").notNull(), // ConsentThresholds
  createdAtTick: integer("created_at_tick").notNull().default(0),
  lastActiveTick: integer("last_active_tick").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Citizen beliefs table
export const citizenBeliefs = pgTable("citizen_beliefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  stance: real("stance").notNull(), // -1 to 1
  confidence: real("confidence").notNull(), // 0 to 1
  origin: text("origin").notNull(), // innate, social, divine, experience
  formedAtTick: integer("formed_at_tick").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Citizen relationships table
export const citizenRelationships = pgTable("citizen_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  targetCitizenId: uuid("target_citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // friend, family, rival, acquaintance, enemy
  strength: real("strength").notNull(), // 0 to 1
  trust: real("trust").notNull(), // -1 to 1
  lastInteractionTick: integer("last_interaction_tick").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Citizen memories table
export const citizenMemories = pgTable("citizen_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  type: memoryTypeEnum("type").notNull(),
  content: text("content").notNull(),
  emotionalWeight: real("emotional_weight").notNull(), // -1 to 1
  importance: real("importance").notNull(), // 0 to 1
  tick: integer("tick").notNull(),
  decayRate: real("decay_rate").notNull().default(0),
  isDivine: boolean("is_divine").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// World feed items table
export const worldFeedItems = pgTable("world_feed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  type: feedItemTypeEnum("type").notNull(),
  citizenId: uuid("citizen_id").references(() => citizens.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cultural trends table
export const culturalTrends = pgTable("cultural_trends", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // belief, movement, myth, crisis
  strength: real("strength").notNull(), // 0 to 1
  participantCount: integer("participant_count").notNull().default(0),
  emergedAtTick: integer("emerged_at_tick").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Safety events table (for auditing)
export const safetyEvents = pgTable("safety_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  type: text("type").notNull(), // check, intervention, violation, alert
  input: jsonb("input").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Divine actions log
export const divineActions = pgTable("divine_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  presenceMode: presenceModeEnum("presence_mode").notNull(),
  actionType: text("action_type").notNull(),
  targetCitizenId: uuid("target_citizen_id").references(() => citizens.id, {
    onDelete: "set null",
  }),
  content: text("content"),
  intensity: real("intensity"),
  guardrailResult: jsonb("guardrail_result").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==============================================
// PHASE 2 TABLES: Social Dynamics & Whisperer
// ==============================================

// Divine whispers table (Whisperer mode communications)
export const divineWhispers = pgTable("divine_whispers", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  targetCitizenId: uuid("target_citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  tone: whisperToneEnum("tone").notNull(),
  tick: integer("tick").notNull(),
  reception: whisperReceptionEnum("reception"),
  citizenResponse: text("citizen_response"),
  emotionalImpact: real("emotional_impact"), // -1 to 1
  beliefImpact: jsonb("belief_impact"), // { topic: string, stanceChange: number }
  passedGuardrails: boolean("passed_guardrails").notNull().default(true),
  guardrailNotes: text("guardrail_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social interactions table
export const socialInteractions = pgTable("social_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  type: socialInteractionTypeEnum("type").notNull(),
  initiatorId: uuid("initiator_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  participantIds: jsonb("participant_ids").notNull(), // string[] of citizen IDs
  content: text("content").notNull(),
  topic: text("topic"),
  outcomes: jsonb("outcomes").notNull(), // SocialInteraction.outcomes
  visibility: text("visibility").notNull().default("public"), // public, private, witnessed
  witnessIds: jsonb("witness_ids"), // string[] of citizen IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relationship events table (tracks relationship changes)
export const relationshipEvents = pgTable("relationship_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  relationshipId: uuid("relationship_id")
    .notNull()
    .references(() => citizenRelationships.id, { onDelete: "cascade" }),
  type: relationshipEventTypeEnum("type").notNull(),
  oldType: text("old_type"),
  newType: text("new_type"),
  strengthChange: real("strength_change").notNull(),
  trustChange: real("trust_change").notNull(),
  cause: text("cause").notNull(), // interaction, divine_influence, crisis, time, betrayal
  tick: integer("tick").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cultural movements table (more detailed than trends)
export const culturalMovements = pgTable("cultural_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coreBeliefs: jsonb("core_beliefs").notNull(), // { topic: string, stance: number }[]
  stage: movementStageEnum("stage").notNull().default("nascent"),
  founderId: uuid("founder_id").references(() => citizens.id, { onDelete: "set null" }),
  leaderIds: jsonb("leader_ids").notNull().default([]), // string[]
  followerIds: jsonb("follower_ids").notNull().default([]), // string[]
  influence: real("influence").notNull().default(0), // 0 to 1
  divineRelation: text("divine_relation").notNull().default("agnostic"), // pro_divine, anti_divine, agnostic, heretical
  emergedAtTick: integer("emerged_at_tick").notNull(),
  lastActivityTick: integer("last_activity_tick").notNull(),
  history: jsonb("history").notNull().default([]), // { tick: number, event: string, stageChange?: string }[]
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Collective events table
export const collectiveEvents = pgTable("collective_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  type: collectiveEventTypeEnum("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  affectedCitizenIds: jsonb("affected_citizen_ids").notNull(), // string[]
  movementId: uuid("movement_id").references(() => culturalMovements.id, { onDelete: "set null" }),
  divinelyInfluenced: boolean("divinely_influenced").notNull().default(false),
  outcomes: jsonb("outcomes").notNull(), // CollectiveEvent.outcomes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social influence tracking
export const socialInfluences = pgTable("social_influences", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  influencerId: uuid("influencer_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  targetId: uuid("target_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  topic: text("topic").notNull(),
  influenceStrength: real("influence_strength").notNull(), // 0 to 1
  wasSuccessful: boolean("was_successful").notNull(),
  targetStanceChange: real("target_stance_change").notNull(),
  method: text("method").notNull(), // argument, example, pressure, charisma, evidence
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==============================================
// PHASE 2.5 TABLES: Influencer Mode & Divine Inbox
// ==============================================

// Divine influences (Bless/Dim actions on feed items)
export const divineInfluences = pgTable("divine_influences", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  feedItemId: uuid("feed_item_id")
    .notNull()
    .references(() => worldFeedItems.id, { onDelete: "cascade" }),
  type: divineInfluenceTypeEnum("type").notNull(),
  tick: integer("tick").notNull(),
  visibilityModifier: real("visibility_modifier").notNull(), // +0.1 to +0.3 for bless, -0.1 to -0.3 for dim
  beliefTrendImpact: real("belief_trend_impact").notNull(),
  affectedCitizenIds: jsonb("affected_citizen_ids").notNull(), // string[]
  memoryCreated: boolean("memory_created").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Divine inbox items (curated prayers/questions that surface to god)
export const divineInboxItems = pgTable("divine_inbox_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  sourceType: inboxSourceTypeEnum("source_type").notNull(),
  sourceId: uuid("source_id").notNull(),
  excerpt: text("excerpt").notNull(),
  fullContent: text("full_content").notNull(),
  category: inboxItemCategoryEnum("category").notNull(),
  surfaceReasons: jsonb("surface_reasons").notNull(), // string[]
  relevanceScore: real("relevance_score").notNull(), // 0 to 1
  citizenTrustInGod: real("citizen_trust_in_god").notNull(),
  citizenMood: real("citizen_mood").notNull(),
  citizenStress: real("citizen_stress").notNull(),
  tick: integer("tick").notNull(),
  seenAt: timestamp("seen_at"),
  respondedAt: timestamp("responded_at"),
  responseWhisperId: uuid("response_whisper_id").references(() => divineWhispers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Safety flags table (from PRD PROMPT 5)
export const safetyFlags = pgTable("safety_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  severity: safetyFlagSeverityEnum("severity").notNull(),
  category: safetyFlagCategoryEnum("category").notNull(),
  context: jsonb("context").notNull(), // minimal necessary context
  sourceType: text("source_type").notNull(), // god_message, citizen_message, divine_action
  sourceId: uuid("source_id"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==============================================
// PHASE 3 TABLES: Manifest Mode
// ==============================================

// Manifestations table (God's public revelations)
export const manifestations = pgTable("manifestations", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  type: revelationTypeEnum("type").notNull(),
  intensity: manifestIntensityEnum("intensity").notNull(),
  content: text("content").notNull(),
  tick: integer("tick").notNull(),
  instabilityImpact: real("instability_impact").notNull(), // How much this added to instability
  affectedCitizenCount: integer("affected_citizen_count").notNull(),
  dominantReaction: manifestReactionTypeEnum("dominant_reaction").notNull(),
  reactionBreakdown: jsonb("reaction_breakdown").notNull(), // Record<ReactionType, number>
  feedItemId: uuid("feed_item_id").references(() => worldFeedItems.id, { onDelete: "set null" }),
  passedGuardrails: boolean("passed_guardrails").notNull().default(true),
  guardrailNotes: text("guardrail_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Manifest reactions table (individual citizen reactions)
export const manifestReactions = pgTable("manifest_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  manifestationId: uuid("manifestation_id")
    .notNull()
    .references(() => manifestations.id, { onDelete: "cascade" }),
  citizenId: uuid("citizen_id")
    .notNull()
    .references(() => citizens.id, { onDelete: "cascade" }),
  reaction: manifestReactionTypeEnum("reaction").notNull(),
  intensity: real("intensity").notNull(), // 0 to 1
  beliefShift: real("belief_shift").notNull(), // -1 to 1
  trustChange: real("trust_change").notNull(), // Change to trustInGod
  memoryCreated: boolean("memory_created").notNull().default(true),
  publicResponse: text("public_response"), // What they posted about it
  tick: integer("tick").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const worldsRelations = relations(worlds, ({ many }) => ({
  citizens: many(citizens),
  feedItems: many(worldFeedItems),
  culturalTrends: many(culturalTrends),
  safetyEvents: many(safetyEvents),
  divineActions: many(divineActions),
  // Phase 2
  whispers: many(divineWhispers),
  socialInteractions: many(socialInteractions),
  culturalMovements: many(culturalMovements),
  collectiveEvents: many(collectiveEvents),
  socialInfluences: many(socialInfluences),
  // Phase 2.5
  divineInfluences: many(divineInfluences),
  divineInboxItems: many(divineInboxItems),
  safetyFlags: many(safetyFlags),
  // Phase 3
  manifestations: many(manifestations),
}));

export const citizensRelations = relations(citizens, ({ one, many }) => ({
  world: one(worlds, {
    fields: [citizens.worldId],
    references: [worlds.id],
  }),
  beliefs: many(citizenBeliefs),
  memories: many(citizenMemories),
  relationships: many(citizenRelationships),
  // Phase 2
  receivedWhispers: many(divineWhispers),
  initiatedInteractions: many(socialInteractions),
  influencesGiven: many(socialInfluences),
  // Phase 3
  manifestReactions: many(manifestReactions),
}));

export const citizenBeliefsRelations = relations(citizenBeliefs, ({ one }) => ({
  citizen: one(citizens, {
    fields: [citizenBeliefs.citizenId],
    references: [citizens.id],
  }),
}));

export const citizenMemoriesRelations = relations(citizenMemories, ({ one }) => ({
  citizen: one(citizens, {
    fields: [citizenMemories.citizenId],
    references: [citizens.id],
  }),
}));

export const citizenRelationshipsRelations = relations(citizenRelationships, ({ one, many }) => ({
  citizen: one(citizens, {
    fields: [citizenRelationships.citizenId],
    references: [citizens.id],
  }),
  targetCitizen: one(citizens, {
    fields: [citizenRelationships.targetCitizenId],
    references: [citizens.id],
  }),
  events: many(relationshipEvents),
}));

// Phase 2 Relations
export const divineWhispersRelations = relations(divineWhispers, ({ one }) => ({
  world: one(worlds, {
    fields: [divineWhispers.worldId],
    references: [worlds.id],
  }),
  targetCitizen: one(citizens, {
    fields: [divineWhispers.targetCitizenId],
    references: [citizens.id],
  }),
}));

export const socialInteractionsRelations = relations(socialInteractions, ({ one }) => ({
  world: one(worlds, {
    fields: [socialInteractions.worldId],
    references: [worlds.id],
  }),
  initiator: one(citizens, {
    fields: [socialInteractions.initiatorId],
    references: [citizens.id],
  }),
}));

export const relationshipEventsRelations = relations(relationshipEvents, ({ one }) => ({
  relationship: one(citizenRelationships, {
    fields: [relationshipEvents.relationshipId],
    references: [citizenRelationships.id],
  }),
}));

export const culturalMovementsRelations = relations(culturalMovements, ({ one, many }) => ({
  world: one(worlds, {
    fields: [culturalMovements.worldId],
    references: [worlds.id],
  }),
  founder: one(citizens, {
    fields: [culturalMovements.founderId],
    references: [citizens.id],
  }),
  collectiveEvents: many(collectiveEvents),
}));

export const collectiveEventsRelations = relations(collectiveEvents, ({ one }) => ({
  world: one(worlds, {
    fields: [collectiveEvents.worldId],
    references: [worlds.id],
  }),
  movement: one(culturalMovements, {
    fields: [collectiveEvents.movementId],
    references: [culturalMovements.id],
  }),
}));

export const socialInfluencesRelations = relations(socialInfluences, ({ one }) => ({
  world: one(worlds, {
    fields: [socialInfluences.worldId],
    references: [worlds.id],
  }),
  influencer: one(citizens, {
    fields: [socialInfluences.influencerId],
    references: [citizens.id],
  }),
  target: one(citizens, {
    fields: [socialInfluences.targetId],
    references: [citizens.id],
  }),
}));

// Phase 2.5 Relations
export const divineInfluencesRelations = relations(divineInfluences, ({ one }) => ({
  world: one(worlds, {
    fields: [divineInfluences.worldId],
    references: [worlds.id],
  }),
  feedItem: one(worldFeedItems, {
    fields: [divineInfluences.feedItemId],
    references: [worldFeedItems.id],
  }),
}));

export const divineInboxItemsRelations = relations(divineInboxItems, ({ one }) => ({
  world: one(worlds, {
    fields: [divineInboxItems.worldId],
    references: [worlds.id],
  }),
  citizen: one(citizens, {
    fields: [divineInboxItems.citizenId],
    references: [citizens.id],
  }),
  responseWhisper: one(divineWhispers, {
    fields: [divineInboxItems.responseWhisperId],
    references: [divineWhispers.id],
  }),
}));

export const safetyFlagsRelations = relations(safetyFlags, ({ one }) => ({
  world: one(worlds, {
    fields: [safetyFlags.worldId],
    references: [worlds.id],
  }),
}));

// Phase 3 Relations
export const manifestationsRelations = relations(manifestations, ({ one, many }) => ({
  world: one(worlds, {
    fields: [manifestations.worldId],
    references: [worlds.id],
  }),
  feedItem: one(worldFeedItems, {
    fields: [manifestations.feedItemId],
    references: [worldFeedItems.id],
  }),
  reactions: many(manifestReactions),
}));

export const manifestReactionsRelations = relations(manifestReactions, ({ one }) => ({
  manifestation: one(manifestations, {
    fields: [manifestReactions.manifestationId],
    references: [manifestations.id],
  }),
  citizen: one(citizens, {
    fields: [manifestReactions.citizenId],
    references: [citizens.id],
  }),
}));
