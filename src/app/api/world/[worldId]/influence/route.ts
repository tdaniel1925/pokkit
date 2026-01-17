/**
 * Influence API Route - Influencer Mode (Bless/Dim)
 * From PRD PROMPT 7
 *
 * POST: Apply Bless or Dim to a feed item
 * GET: Get influence history for a world
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  divineInfluences,
  worldFeedItems,
  citizens,
  worlds,
  citizenMemories,
  culturalTrends,
  divineActions,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  applyDivineInfluence,
  generateInfluenceMemory,
  isInfluenceOnCooldown,
} from "@/lib/influencer";
import type { Citizen } from "@/types/citizen";
import type { WorldState, WorldConfig, WorldFeedItem, CulturalTrend } from "@/types/world";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// Validation schema for influence action
const InfluenceActionSchema = z.object({
  feedItemId: z.string().uuid(),
  type: z.enum(["bless", "dim"]),
});

// POST: Apply a divine influence (Bless or Dim)
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
    const validationResult = InfluenceActionSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid influence data", "VALIDATION_ERROR", 400);
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
    if (worldRow.presenceMode !== "influencer") {
      return errorResponse(
        "Must be in Influencer mode to bless/dim",
        "WRONG_MODE",
        400
      );
    }

    // Check cooldown
    if (
      isInfluenceOnCooldown(
        worldRow.presenceLastActionTick ?? undefined,
        world.tick
      )
    ) {
      return errorResponse(
        "Influence action on cooldown",
        "COOLDOWN",
        429
      );
    }

    // Fetch feed item
    const feedItemResult = await db
      .select()
      .from(worldFeedItems)
      .where(eq(worldFeedItems.id, input.feedItemId))
      .limit(1);

    if (feedItemResult.length === 0) {
      return errorResponse("Feed item not found", "NOT_FOUND", 404);
    }

    const feedItemRow = feedItemResult[0];
    const feedItem: WorldFeedItem = {
      id: feedItemRow.id,
      worldId: feedItemRow.worldId,
      tick: feedItemRow.tick,
      type: feedItemRow.type,
      citizenId: feedItemRow.citizenId ?? undefined,
      content: feedItemRow.content,
      metadata: feedItemRow.metadata as Record<string, unknown>,
      createdAt: feedItemRow.createdAt,
    };

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

    // Fetch cultural trends
    const trendRows = await db
      .select()
      .from(culturalTrends)
      .where(eq(culturalTrends.worldId, worldId));

    const trends: CulturalTrend[] = trendRows.map((t) => ({
      id: t.id,
      worldId: t.worldId,
      name: t.name,
      type: t.type as CulturalTrend["type"],
      strength: t.strength,
      participantCount: t.participantCount,
      emergedAtTick: t.emergedAtTick,
      description: t.description,
    }));

    // Apply the divine influence
    const result = await applyDivineInfluence(
      input,
      feedItem,
      world,
      allCitizens,
      trends
    );

    if (!result.success || !result.influence) {
      return errorResponse(
        result.guardrailWarnings?.[0] || "Influence action blocked",
        "BLOCKED",
        403
      );
    }

    // Store the influence in database
    await db.insert(divineInfluences).values({
      worldId: result.influence.worldId,
      feedItemId: result.influence.feedItemId,
      type: result.influence.type,
      tick: result.influence.tick,
      visibilityModifier: result.influence.visibilityModifier,
      beliefTrendImpact: result.influence.beliefTrendImpact,
      affectedCitizenIds: result.influence.affectedCitizenIds,
      memoryCreated: result.influence.memoryCreated,
    });

    // Create memories for affected citizens
    const affectedCitizens = allCitizens.filter((c) =>
      result.influence!.affectedCitizenIds.includes(c.id)
    );

    for (const citizen of affectedCitizens) {
      const noticed = result.citizensNoticed.includes(citizen.id);
      const memoryContent = generateInfluenceMemory(
        result.influence.type,
        feedItem,
        noticed
      );

      await db.insert(citizenMemories).values({
        citizenId: citizen.id,
        type: noticed ? "divine_interaction" : "short_term",
        content: memoryContent,
        emotionalWeight: result.influence.type === "bless" ? 0.2 : -0.1,
        importance: noticed ? 0.7 : 0.3,
        tick: world.tick,
        decayRate: noticed ? 0 : 0.1, // Divine memories don't decay
        isDivine: noticed,
      });
    }

    // Update trend strengths
    for (const shift of result.trendShifts) {
      const currentTrend = trendRows.find((t) => t.id === shift.trendId);
      if (currentTrend) {
        const newStrength = Math.max(
          0,
          Math.min(1, currentTrend.strength + shift.strengthChange)
        );
        await db
          .update(culturalTrends)
          .set({ strength: newStrength, updatedAt: new Date() })
          .where(eq(culturalTrends.id, shift.trendId));
      }
    }

    // Log divine action
    await db.insert(divineActions).values({
      worldId: world.id,
      tick: world.tick,
      presenceMode: "influencer",
      actionType: result.influence.type,
      content: feedItem.content.slice(0, 200),
      intensity: Math.abs(result.influence.visibilityModifier),
      guardrailResult: { passed: true, warnings: result.guardrailWarnings },
    });

    // Update last action tick
    await db
      .update(worlds)
      .set({ presenceLastActionTick: world.tick, updatedAt: new Date() })
      .where(eq(worlds.id, worldId));

    return NextResponse.json({
      success: true,
      influence: result.influence,
      trendShifts: result.trendShifts,
      memoriesCreated: result.memoriesCreated,
      citizensNoticed: result.citizensNoticed.length,
    });
  } catch (error) {
    console.error("POST /api/world/[worldId]/influence error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// GET: Get influence history for a world
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const type = searchParams.get("type"); // "bless" or "dim"

    let query = db
      .select()
      .from(divineInfluences)
      .where(eq(divineInfluences.worldId, worldId))
      .orderBy(desc(divineInfluences.createdAt))
      .limit(limit);

    const influences = await query;

    // Filter by type if specified
    const filtered = type
      ? influences.filter((i) => i.type === type)
      : influences;

    // Calculate summary
    const blessCount = influences.filter((i) => i.type === "bless").length;
    const dimCount = influences.filter((i) => i.type === "dim").length;

    return NextResponse.json({
      influences: filtered,
      summary: {
        total: influences.length,
        blessCount,
        dimCount,
      },
    });
  } catch (error) {
    console.error("GET /api/world/[worldId]/influence error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
