/**
 * Social Interactions API Route - Phase 2
 *
 * GET: Get social interactions and relationships
 * POST: Generate a social interaction between citizens
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  socialInteractions,
  citizenRelationships,
  relationshipEvents,
  citizens,
  worlds,
} from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import {
  generateInteraction,
  formRelationship,
  updateRelationship,
  calculateSocialCohesion,
  findInfluentialCitizens,
  findIsolatedCitizens,
} from "@/lib/social";
import type { Citizen, CitizenRelationship } from "@/types/citizen";
import type { WorldState, WorldConfig } from "@/types/world";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// GET: Get social data for a world
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    switch (type) {
      case "interactions": {
        // Get recent social interactions
        const interactions = await db
          .select()
          .from(socialInteractions)
          .where(eq(socialInteractions.worldId, worldId))
          .orderBy(desc(socialInteractions.createdAt))
          .limit(limit);

        return NextResponse.json({ interactions });
      }

      case "relationships": {
        // Get all relationships in the world
        const citizenList = await db
          .select({ id: citizens.id })
          .from(citizens)
          .where(eq(citizens.worldId, worldId));

        const citizenIds = citizenList.map((c) => c.id);

        if (citizenIds.length === 0) {
          return NextResponse.json({ relationships: [] });
        }

        // This is a simplified query - in production would use proper joins
        const relationships = await db
          .select()
          .from(citizenRelationships)
          .limit(limit * 2);

        // Filter to only relationships where both citizens are in this world
        const worldRelationships = relationships.filter(
          (r) =>
            citizenIds.includes(r.citizenId) &&
            citizenIds.includes(r.targetCitizenId)
        );

        return NextResponse.json({
          relationships: worldRelationships.slice(0, limit),
        });
      }

      case "overview":
      default: {
        // Get comprehensive social overview
        const citizenList = await db
          .select()
          .from(citizens)
          .where(eq(citizens.worldId, worldId));

        const citizenIds = citizenList.map((c) => c.id);

        // Get relationships
        const allRelationships = await db
          .select()
          .from(citizenRelationships)
          .limit(500);

        const worldRelationships = allRelationships.filter(
          (r) =>
            citizenIds.includes(r.citizenId) &&
            citizenIds.includes(r.targetCitizenId)
        ) as CitizenRelationship[];

        // Build citizen objects for analysis
        const citizenObjects: Citizen[] = citizenList.map((c) => ({
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

        // Calculate social metrics
        const cohesion = calculateSocialCohesion(citizenObjects, worldRelationships);
        const influential = findInfluentialCitizens(
          citizenObjects,
          worldRelationships,
          5
        );
        const isolated = findIsolatedCitizens(
          citizenObjects,
          worldRelationships,
          2
        );

        // Get recent interactions
        const recentInteractions = await db
          .select()
          .from(socialInteractions)
          .where(eq(socialInteractions.worldId, worldId))
          .orderBy(desc(socialInteractions.createdAt))
          .limit(10);

        return NextResponse.json({
          overview: {
            totalCitizens: citizenList.length,
            totalRelationships: worldRelationships.length,
            socialCohesion: cohesion,
            influentialCitizens: influential.map((i) => ({
              id: i.citizen.id,
              name: i.citizen.name,
              score: i.score,
            })),
            isolatedCitizens: isolated.map((c) => ({
              id: c.id,
              name: c.name,
            })),
            recentInteractions: recentInteractions.length,
          },
        });
      }
    }
  } catch (error) {
    console.error("GET /api/world/[worldId]/social error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// POST: Generate a social interaction
const GenerateInteractionSchema = z.object({
  initiatorId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1).max(5),
  type: z.string().optional(),
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
    const validationResult = GenerateInteractionSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid request data", "VALIDATION_ERROR", 400);
    }

    const { initiatorId, participantIds, type } = validationResult.data;

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

    // Fetch initiator
    const initiatorResult = await db
      .select()
      .from(citizens)
      .where(eq(citizens.id, initiatorId))
      .limit(1);

    if (initiatorResult.length === 0) {
      return errorResponse("Initiator not found", "NOT_FOUND", 404);
    }

    // Fetch participants
    const participantResults = await db
      .select()
      .from(citizens)
      .where(eq(citizens.worldId, worldId));

    const participantRows = participantResults.filter((p) =>
      participantIds.includes(p.id)
    );

    if (participantRows.length !== participantIds.length) {
      return errorResponse(
        "Some participants not found",
        "NOT_FOUND",
        404
      );
    }

    // Build citizen objects
    const buildCitizen = (row: (typeof participantRows)[0]): Citizen => ({
      id: row.id,
      worldId: row.worldId,
      name: row.name,
      attributes: row.attributes as Citizen["attributes"],
      state: row.state as Citizen["state"],
      consent: row.consent as Citizen["consent"],
      beliefs: [],
      createdAtTick: row.createdAtTick,
      lastActiveTick: row.lastActiveTick,
    });

    const initiator = buildCitizen(initiatorResult[0]);
    const participants = participantRows.map(buildCitizen);

    // Generate the interaction
    const result = generateInteraction(
      initiator,
      participants,
      world,
      type as undefined // Would validate against SocialInteractionType
    );

    // Store the interaction
    await db.insert(socialInteractions).values({
      worldId: result.interaction.worldId,
      tick: result.interaction.tick,
      type: result.interaction.type,
      initiatorId: result.interaction.initiatorId,
      participantIds: result.interaction.participants,
      content: result.interaction.content,
      topic: result.interaction.topic,
      outcomes: result.interaction.outcomes,
      visibility: result.interaction.visibility,
      witnessIds: result.interaction.witnesses,
    });

    // Apply state updates to citizens
    for (const outcome of result.outcomes) {
      const currentCitizen = [initiator, ...participants].find(
        (c) => c.id === outcome.citizenId
      );
      if (!currentCitizen) continue;

      const updatedState = {
        ...(currentCitizen.state as object),
        mood: Math.max(
          -1,
          Math.min(1, currentCitizen.state.mood + outcome.moodChange)
        ),
        stress: Math.max(
          0,
          Math.min(1, currentCitizen.state.stress + outcome.stressChange)
        ),
      };

      await db
        .update(citizens)
        .set({ state: updatedState, updatedAt: new Date() })
        .where(eq(citizens.id, outcome.citizenId));
    }

    return NextResponse.json({
      success: true,
      interaction: result.interaction,
      outcomes: result.outcomes,
    });
  } catch (error) {
    console.error("POST /api/world/[worldId]/social error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
