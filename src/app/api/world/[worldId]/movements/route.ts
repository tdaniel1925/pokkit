/**
 * Cultural Movements API Route - Phase 2
 *
 * GET: Get cultural movements and trends
 * POST: Trigger collective event
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  culturalMovements,
  collectiveEvents,
  culturalTrends,
  citizens,
  citizenBeliefs,
  worlds,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  detectEmergingMovement,
  updateMovement,
  generateCollectiveEvent,
  updateCulturalTrends,
} from "@/lib/cultural";
import type { Citizen, CitizenBelief } from "@/types/citizen";
import type { WorldState, WorldConfig, CulturalTrend } from "@/types/world";
import type { CulturalMovement, CollectiveEvent } from "@/types/social";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// GET: Get cultural movements and trends
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
    const type = searchParams.get("type") || "overview";

    switch (type) {
      case "movements": {
        // Get all movements
        const movements = await db
          .select()
          .from(culturalMovements)
          .where(eq(culturalMovements.worldId, worldId))
          .orderBy(desc(culturalMovements.influence));

        return NextResponse.json({ movements });
      }

      case "events": {
        // Get collective events
        const limit = Math.min(
          parseInt(searchParams.get("limit") || "20"),
          100
        );

        const events = await db
          .select()
          .from(collectiveEvents)
          .where(eq(collectiveEvents.worldId, worldId))
          .orderBy(desc(collectiveEvents.createdAt))
          .limit(limit);

        return NextResponse.json({ events });
      }

      case "trends": {
        // Get cultural trends
        const trends = await db
          .select()
          .from(culturalTrends)
          .where(eq(culturalTrends.worldId, worldId))
          .orderBy(desc(culturalTrends.strength));

        return NextResponse.json({ trends });
      }

      case "overview":
      default: {
        // Get comprehensive cultural overview
        const [movements, events, trends] = await Promise.all([
          db
            .select()
            .from(culturalMovements)
            .where(eq(culturalMovements.worldId, worldId))
            .orderBy(desc(culturalMovements.influence))
            .limit(10),
          db
            .select()
            .from(collectiveEvents)
            .where(eq(collectiveEvents.worldId, worldId))
            .orderBy(desc(collectiveEvents.createdAt))
            .limit(5),
          db
            .select()
            .from(culturalTrends)
            .where(eq(culturalTrends.worldId, worldId))
            .orderBy(desc(culturalTrends.strength))
            .limit(10),
        ]);

        // Calculate summary stats
        const activeMovements = movements.filter(
          (m) => !["extinct", "underground"].includes(m.stage)
        );
        const dominantMovement = movements.find((m) => m.stage === "dominant");

        return NextResponse.json({
          overview: {
            totalMovements: movements.length,
            activeMovements: activeMovements.length,
            dominantMovement: dominantMovement
              ? {
                  id: dominantMovement.id,
                  name: dominantMovement.name,
                  influence: dominantMovement.influence,
                }
              : null,
            recentEvents: events.length,
            activeTrends: trends.filter((t) => t.strength > 0.2).length,
          },
          movements: movements.slice(0, 5),
          recentEvents: events,
          topTrends: trends.slice(0, 5),
        });
      }
    }
  } catch (error) {
    console.error("GET /api/world/[worldId]/movements error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// POST: Trigger a collective event or detect new movements
const TriggerEventSchema = z.object({
  action: z.enum(["trigger_event", "detect_movements", "update_movements"]),
  eventType: z
    .enum([
      "celebration",
      "crisis",
      "disaster",
      "miracle",
      "revelation",
      "schism",
      "reform",
    ])
    .optional(),
  affectedCitizenIds: z.array(z.string().uuid()).optional(),
  movementId: z.string().uuid().optional(),
  isDivine: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    const body = await request.json();
    const validationResult = TriggerEventSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid request data", "VALIDATION_ERROR", 400);
    }

    const { action, eventType, affectedCitizenIds, movementId, isDivine } =
      validationResult.data;

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

    // Fetch citizens with their beliefs
    const citizenRows = await db
      .select()
      .from(citizens)
      .where(eq(citizens.worldId, worldId));

    const beliefRows = await db
      .select()
      .from(citizenBeliefs)
      .where(
        eq(
          citizenBeliefs.citizenId,
          citizenRows.length > 0 ? citizenRows[0].id : ""
        )
      );

    // Build citizen objects with beliefs
    const citizenObjects: Citizen[] = citizenRows.map((c) => ({
      id: c.id,
      worldId: c.worldId,
      name: c.name,
      attributes: c.attributes as Citizen["attributes"],
      state: c.state as Citizen["state"],
      consent: c.consent as Citizen["consent"],
      beliefs: beliefRows
        .filter((b) => b.citizenId === c.id)
        .map((b) => ({
          id: b.id,
          topic: b.topic,
          stance: b.stance,
          confidence: b.confidence,
          origin: b.origin as CitizenBelief["origin"],
          formedAtTick: b.formedAtTick,
        })),
      createdAtTick: c.createdAtTick,
      lastActiveTick: c.lastActiveTick,
    }));

    switch (action) {
      case "trigger_event": {
        if (!eventType) {
          return errorResponse(
            "Event type required",
            "VALIDATION_ERROR",
            400
          );
        }

        // Get affected citizens
        const affected = affectedCitizenIds
          ? citizenObjects.filter((c) => affectedCitizenIds.includes(c.id))
          : citizenObjects;

        if (affected.length === 0) {
          return errorResponse(
            "No citizens to affect",
            "VALIDATION_ERROR",
            400
          );
        }

        // Get movement if specified
        let movement: CulturalMovement | undefined;
        if (movementId) {
          const movementResult = await db
            .select()
            .from(culturalMovements)
            .where(eq(culturalMovements.id, movementId))
            .limit(1);

          if (movementResult.length > 0) {
            const m = movementResult[0];
            movement = {
              id: m.id,
              worldId: m.worldId,
              name: m.name,
              description: m.description,
              coreBeliefs: m.coreBeliefs as CulturalMovement["coreBeliefs"],
              stage: m.stage,
              founderId: m.founderId ?? undefined,
              leaderIds: m.leaderIds as string[],
              followerIds: m.followerIds as string[],
              influence: m.influence,
              divineRelation:
                m.divineRelation as CulturalMovement["divineRelation"],
              emergedAtTick: m.emergedAtTick,
              lastActivityTick: m.lastActivityTick,
              history: m.history as CulturalMovement["history"],
            };
          }
        }

        // Generate the collective event
        const result = generateCollectiveEvent(
          eventType,
          affected,
          world,
          movement,
          isDivine
        );

        // Store the event
        await db.insert(collectiveEvents).values({
          worldId: result.event.worldId,
          tick: result.event.tick,
          type: result.event.type,
          name: result.event.name,
          description: result.event.description,
          affectedCitizenIds: result.event.affectedCitizenIds,
          movementId: result.event.movementId,
          divinelyInfluenced: result.event.divinelyInfluenced,
          outcomes: result.event.outcomes,
        });

        // Apply citizen state updates
        for (const [citizenId, updates] of Array.from(result.citizenUpdates.entries())) {
          const currentCitizen = citizenObjects.find((c) => c.id === citizenId);
          if (!currentCitizen) continue;

          const updatedState = {
            ...(currentCitizen.state as object),
            ...updates,
          };

          await db
            .update(citizens)
            .set({ state: updatedState, updatedAt: new Date() })
            .where(eq(citizens.id, citizenId));
        }

        return NextResponse.json({
          success: true,
          event: result.event,
          worldUpdates: result.worldUpdates,
          affectedCount: affected.length,
        });
      }

      case "detect_movements": {
        // Get existing movements
        const existingMovements = await db
          .select()
          .from(culturalMovements)
          .where(eq(culturalMovements.worldId, worldId));

        const movementObjects: CulturalMovement[] = existingMovements.map(
          (m) => ({
            id: m.id,
            worldId: m.worldId,
            name: m.name,
            description: m.description,
            coreBeliefs: m.coreBeliefs as CulturalMovement["coreBeliefs"],
            stage: m.stage,
            founderId: m.founderId ?? undefined,
            leaderIds: m.leaderIds as string[],
            followerIds: m.followerIds as string[],
            influence: m.influence,
            divineRelation:
              m.divineRelation as CulturalMovement["divineRelation"],
            emergedAtTick: m.emergedAtTick,
            lastActivityTick: m.lastActivityTick,
            history: m.history as CulturalMovement["history"],
          })
        );

        // Detect emerging movements
        const detection = detectEmergingMovement(
          citizenObjects,
          movementObjects,
          world
        );

        if (detection.detected && detection.movement) {
          // Store the new movement
          await db.insert(culturalMovements).values({
            worldId: detection.movement.worldId,
            name: detection.movement.name,
            description: detection.movement.description,
            coreBeliefs: detection.movement.coreBeliefs,
            stage: detection.movement.stage,
            founderId: detection.movement.founderId,
            leaderIds: detection.movement.leaderIds,
            followerIds: detection.movement.followerIds,
            influence: detection.movement.influence,
            divineRelation: detection.movement.divineRelation,
            emergedAtTick: detection.movement.emergedAtTick,
            lastActivityTick: detection.movement.lastActivityTick,
            history: detection.movement.history,
          });

          return NextResponse.json({
            success: true,
            detected: true,
            movement: detection.movement,
            reason: detection.reason,
          });
        }

        return NextResponse.json({
          success: true,
          detected: false,
          reason: detection.reason,
        });
      }

      case "update_movements": {
        // Update all movements in the world
        const existingMovements = await db
          .select()
          .from(culturalMovements)
          .where(eq(culturalMovements.worldId, worldId));

        const results: {
          id: string;
          stageChanged: boolean;
          newStage?: string;
        }[] = [];

        for (const m of existingMovements) {
          const movementObj: CulturalMovement = {
            id: m.id,
            worldId: m.worldId,
            name: m.name,
            description: m.description,
            coreBeliefs: m.coreBeliefs as CulturalMovement["coreBeliefs"],
            stage: m.stage,
            founderId: m.founderId ?? undefined,
            leaderIds: m.leaderIds as string[],
            followerIds: m.followerIds as string[],
            influence: m.influence,
            divineRelation:
              m.divineRelation as CulturalMovement["divineRelation"],
            emergedAtTick: m.emergedAtTick,
            lastActivityTick: m.lastActivityTick,
            history: m.history as CulturalMovement["history"],
          };

          const updateResult = updateMovement(movementObj, citizenObjects, world);

          // Update in database
          await db
            .update(culturalMovements)
            .set({
              followerIds: updateResult.movement.followerIds,
              leaderIds: updateResult.movement.leaderIds,
              influence: updateResult.movement.influence,
              stage: updateResult.movement.stage,
              lastActivityTick: updateResult.movement.lastActivityTick,
              history: updateResult.movement.history,
              updatedAt: new Date(),
            })
            .where(eq(culturalMovements.id, m.id));

          results.push({
            id: m.id,
            stageChanged: updateResult.stageChanged,
            newStage: updateResult.newStage,
          });
        }

        return NextResponse.json({
          success: true,
          updatedCount: results.length,
          results,
        });
      }

      default:
        return errorResponse("Invalid action", "VALIDATION_ERROR", 400);
    }
  } catch (error) {
    console.error("POST /api/world/[worldId]/movements error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
