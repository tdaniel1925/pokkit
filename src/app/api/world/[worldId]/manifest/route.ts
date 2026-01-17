/**
 * Manifest API Route - Phase 3
 * From PRD PROMPT 10: Manifest Mode (MVP: Rare, High Cost)
 *
 * POST: Execute a divine manifestation (revelation)
 * GET: Get manifestation history for a world
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  manifestations,
  manifestReactions,
  worldFeedItems,
  citizens,
  worlds,
  citizenMemories,
  divineActions,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  executeManifest,
  calculateInstabilityTrend,
  generateManifestMemory,
  isManifestOnCooldown,
  MANIFEST_COOLDOWN_TICKS,
} from "@/lib/manifest";
import type { Citizen } from "@/types/citizen";
import type { WorldState, WorldConfig } from "@/types/world";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// Validation schema for manifest action
const ManifestActionSchema = z.object({
  type: z.enum([
    "proclamation",
    "sign",
    "visitation",
    "prophecy",
    "judgment",
    "blessing",
    "warning",
  ]),
  intensity: z.enum(["subtle", "notable", "undeniable", "overwhelming"]),
  content: z.string().min(10).max(500),
  targetAudience: z
    .enum(["all", "believers", "skeptics", "suffering"])
    .optional(),
});

// POST: Execute a divine manifestation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ManifestActionSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid manifest data", "VALIDATION_ERROR", 400);
    }

    const input = validationResult.data;

    // Fetch world
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return errorResponse("World not found", "NOT_FOUND", 404);
    }

    const worldRow = worldResult[0];
    const world: WorldState = {
      id: worldRow.id,
      userId: worldRow.userId,
      config: worldRow.config as WorldConfig,
      tick: worldRow.tick,
      status: worldRow.status,
      createdAt: worldRow.createdAt,
      updatedAt: worldRow.updatedAt,
    };

    // Check presence mode
    if (worldRow.presenceMode !== "manifest") {
      return errorResponse(
        "Must be in Manifest mode to create revelations",
        "WRONG_MODE",
        400
      );
    }

    // Check cooldown
    if (
      isManifestOnCooldown(
        worldRow.lastManifestTick ?? undefined,
        world.tick,
        MANIFEST_COOLDOWN_TICKS
      )
    ) {
      const cooldownRemaining =
        MANIFEST_COOLDOWN_TICKS -
        (world.tick - (worldRow.lastManifestTick ?? 0));
      return errorResponse(
        `Manifestation on cooldown. ${cooldownRemaining} ticks remaining.`,
        "COOLDOWN",
        429
      );
    }

    // Fetch all citizens
    const citizenRows = await db
      .select()
      .from(citizens)
      .where(eq(citizens.worldId, worldId));

    const allCitizens: Citizen[] = citizenRows.map((c) => ({
      id: c.id,
      worldId: c.worldId,
      name: c.name,
      attributes: c.attributes as Citizen["attributes"],
      state: c.state as Citizen["state"],
      consent: c.consent as Citizen["consent"],
      beliefs: [],
      createdAtTick: c.createdAtTick,
      lastActiveTick: c.lastActiveTick,
    }));

    // Execute the manifestation
    const result = await executeManifest(input, world, allCitizens);

    if (!result.success || !result.manifestation) {
      return errorResponse(
        result.blockReason || "Manifestation blocked",
        "BLOCKED",
        403
      );
    }

    // Create feed item for the revelation
    const [feedItem] = await db
      .insert(worldFeedItems)
      .values({
        worldId,
        tick: world.tick,
        type: "divine_event",
        content: `[DIVINE ${input.type.toUpperCase()}] ${input.content}`,
        metadata: {
          manifestationType: input.type,
          intensity: input.intensity,
          affectedCount: result.manifestation.affectedCitizenCount,
          dominantReaction: result.manifestation.dominantReaction,
        },
      })
      .returning();

    // Store the manifestation
    const [manifestationRecord] = await db
      .insert(manifestations)
      .values({
        worldId: result.manifestation.worldId,
        type: result.manifestation.type,
        intensity: result.manifestation.intensity,
        content: result.manifestation.content,
        tick: result.manifestation.tick,
        instabilityImpact: result.manifestation.instabilityImpact,
        affectedCitizenCount: result.manifestation.affectedCitizenCount,
        dominantReaction: result.manifestation.dominantReaction,
        reactionBreakdown: result.manifestation.reactionBreakdown,
        feedItemId: feedItem.id,
        passedGuardrails: true,
        guardrailNotes: result.guardrailWarnings?.join("; ") || null,
      })
      .returning();

    // Store reactions and create memories
    for (const reaction of result.reactions) {
      // Store reaction
      await db.insert(manifestReactions).values({
        manifestationId: manifestationRecord.id,
        citizenId: reaction.citizenId,
        reaction: reaction.reaction,
        intensity: reaction.intensity,
        beliefShift: reaction.beliefShift,
        trustChange: reaction.trustChange,
        memoryCreated: true,
        publicResponse: reaction.publicResponse,
        tick: reaction.tick,
      });

      // Create memory for the citizen
      const memoryContent = generateManifestMemory(
        reaction.reaction,
        result.manifestation.type,
        result.manifestation.content
      );

      await db.insert(citizenMemories).values({
        citizenId: reaction.citizenId,
        type: "divine_interaction",
        content: memoryContent,
        emotionalWeight: reaction.beliefShift,
        importance: 0.9, // Manifestations are highly important
        tick: world.tick,
        decayRate: 0, // Divine memories don't decay
        isDivine: true,
      });

      // Update citizen trust
      const citizen = citizenRows.find((c) => c.id === reaction.citizenId);
      if (citizen) {
        const currentState = citizen.state as Citizen["state"];
        const newTrust = Math.max(
          -1,
          Math.min(1, currentState.trustInGod + reaction.trustChange)
        );
        await db
          .update(citizens)
          .set({
            state: {
              ...currentState,
              trustInGod: newTrust,
            },
            updatedAt: new Date(),
          })
          .where(eq(citizens.id, reaction.citizenId));
      }

      // Create public response feed items for those who responded
      if (reaction.publicResponse) {
        await db.insert(worldFeedItems).values({
          worldId,
          tick: world.tick,
          type: "citizen_post",
          citizenId: reaction.citizenId,
          content: reaction.publicResponse,
          metadata: {
            inResponseTo: "manifestation",
            manifestationId: manifestationRecord.id,
            reaction: reaction.reaction,
          },
        });
      }
    }

    // Log divine action
    await db.insert(divineActions).values({
      worldId: world.id,
      tick: world.tick,
      presenceMode: "manifest",
      actionType: `manifest_${result.manifestation.type}`,
      content: result.manifestation.content.slice(0, 200),
      intensity: result.manifestation.instabilityImpact,
      guardrailResult: {
        passed: true,
        warnings: result.guardrailWarnings,
      },
    });

    // Calculate new instability trend
    const previousInstability = worldRow.instability ?? 0;
    const newTrend = calculateInstabilityTrend(
      result.newInstability,
      previousInstability
    );

    // Update world state
    await db
      .update(worlds)
      .set({
        instability: result.newInstability,
        instabilityTrend: newTrend,
        lastManifestTick: world.tick,
        manifestCount: (worldRow.manifestCount ?? 0) + 1,
        manifestCooldownUntil: result.cooldownUntilTick,
        presenceLastActionTick: world.tick,
        updatedAt: new Date(),
      })
      .where(eq(worlds.id, worldId));

    return NextResponse.json({
      success: true,
      manifestation: {
        id: manifestationRecord.id,
        type: result.manifestation.type,
        intensity: result.manifestation.intensity,
        affectedCitizenCount: result.manifestation.affectedCitizenCount,
        dominantReaction: result.manifestation.dominantReaction,
        reactionBreakdown: result.manifestation.reactionBreakdown,
        instabilityImpact: result.manifestation.instabilityImpact,
      },
      newInstability: result.newInstability,
      instabilityTrend: newTrend,
      cooldownUntilTick: result.cooldownUntilTick,
      reactionsCount: result.reactions.length,
      publicResponsesCount: result.reactions.filter((r) => r.publicResponse)
        .length,
    });
  } catch (error) {
    console.error("POST /api/world/[worldId]/manifest error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// GET: Get manifestation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const includeReactions = searchParams.get("reactions") === "true";

    // Fetch manifestations
    const manifestationRows = await db
      .select()
      .from(manifestations)
      .where(eq(manifestations.worldId, worldId))
      .orderBy(desc(manifestations.createdAt))
      .limit(limit);

    // Optionally fetch reactions
    let reactionsMap: Record<string, any[]> = {};
    if (includeReactions && manifestationRows.length > 0) {
      const manifestIds = manifestationRows.map((m) => m.id);
      for (const id of manifestIds) {
        const reactions = await db
          .select()
          .from(manifestReactions)
          .where(eq(manifestReactions.manifestationId, id))
          .limit(20);
        reactionsMap[id] = reactions;
      }
    }

    // Fetch world for instability summary
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    const world = worldResult[0];

    return NextResponse.json({
      manifestations: manifestationRows.map((m) => ({
        ...m,
        reactions: includeReactions ? reactionsMap[m.id] || [] : undefined,
      })),
      summary: {
        total: manifestationRows.length,
        currentInstability: world?.instability ?? 0,
        instabilityTrend: world?.instabilityTrend ?? "stable",
        manifestCount: world?.manifestCount ?? 0,
        lastManifestTick: world?.lastManifestTick,
        cooldownUntilTick: world?.manifestCooldownUntil,
      },
    });
  } catch (error) {
    console.error("GET /api/world/[worldId]/manifest error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
