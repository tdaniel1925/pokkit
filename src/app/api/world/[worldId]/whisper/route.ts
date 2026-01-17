/**
 * Whisper API Route - Phase 2
 *
 * POST: Send a whisper to a citizen
 * GET: Get whisper history for a world
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { divineWhispers, citizens, worlds } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendWhisper } from "@/lib/whisperer";
import { DivineWhisperSchema } from "@/types/social";
import type { Citizen } from "@/types/citizen";
import type { WorldState, WorldConfig } from "@/types/world";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// POST: Send a whisper to a citizen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    // Check if database is available
    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = DivineWhisperSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "Invalid whisper data",
        "VALIDATION_ERROR",
        400
      );
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

    // Fetch target citizen
    const citizenResult = await db
      .select()
      .from(citizens)
      .where(eq(citizens.id, input.targetCitizenId))
      .limit(1);

    if (citizenResult.length === 0) {
      return errorResponse("Citizen not found", "NOT_FOUND", 404);
    }

    const citizenRow = citizenResult[0];

    // Build world state
    const world: WorldState = {
      id: worldRow.id,
      userId: worldRow.userId,
      config: worldRow.config as WorldConfig,
      tick: worldRow.tick,
      status: worldRow.status,
      createdAt: worldRow.createdAt,
      updatedAt: worldRow.updatedAt,
    };

    // Build citizen object
    const citizen: Citizen = {
      id: citizenRow.id,
      worldId: citizenRow.worldId,
      name: citizenRow.name,
      attributes: citizenRow.attributes as Citizen["attributes"],
      state: citizenRow.state as Citizen["state"],
      consent: citizenRow.consent as Citizen["consent"],
      beliefs: [], // Would load from citizenBeliefs table
      createdAtTick: citizenRow.createdAtTick,
      lastActiveTick: citizenRow.lastActiveTick,
    };

    // Send the whisper through the engine
    const result = await sendWhisper(input, citizen, world);

    if (!result.success) {
      // Guardrail blocked the whisper
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          reason: result.error,
        },
        { status: 200 }
      );
    }

    // Store the whisper in the database
    if (result.whisper) {
      await db.insert(divineWhispers).values({
        worldId: result.whisper.worldId,
        targetCitizenId: result.whisper.targetCitizenId,
        content: result.whisper.content,
        tone: result.whisper.tone,
        tick: result.whisper.tick,
        reception: result.whisper.reception,
        citizenResponse: result.whisper.citizenResponse,
        emotionalImpact: result.whisper.emotionalImpact,
        beliefImpact: result.whisper.beliefImpact as Record<string, unknown>,
        passedGuardrails: result.whisper.passedGuardrails,
        guardrailNotes: result.whisper.guardrailNotes,
      });

      // Update citizen state if there were changes
      if (result.stateChanges && Object.keys(result.stateChanges).length > 0) {
        const updatedState = {
          ...(citizenRow.state as object),
          ...result.stateChanges,
        };

        await db
          .update(citizens)
          .set({ state: updatedState, updatedAt: new Date() })
          .where(eq(citizens.id, citizen.id));
      }
    }

    return NextResponse.json({
      success: true,
      whisper: result.whisper,
      reception: result.reception,
      citizenResponse: result.citizenResponse,
      stateChanges: result.stateChanges,
    });
  } catch (error) {
    console.error("POST /api/world/[worldId]/whisper error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// GET: Get whisper history for a world
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const citizenId = searchParams.get("citizenId");

    // Build query
    let query = db
      .select()
      .from(divineWhispers)
      .where(eq(divineWhispers.worldId, worldId))
      .orderBy(desc(divineWhispers.createdAt))
      .limit(limit);

    // Filter by citizen if specified
    if (citizenId) {
      query = db
        .select()
        .from(divineWhispers)
        .where(eq(divineWhispers.targetCitizenId, citizenId))
        .orderBy(desc(divineWhispers.createdAt))
        .limit(limit);
    }

    const whispers = await query;

    return NextResponse.json({
      whispers,
      count: whispers.length,
    });
  } catch (error) {
    console.error("GET /api/world/[worldId]/whisper error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
