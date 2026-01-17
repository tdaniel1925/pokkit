/**
 * World Config API Route - Creator Tools
 * PATCH: Update world configuration
 * GET: Get current configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { worlds } from "@/db/schema";
import { eq } from "drizzle-orm";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// Partial config update schema
const ConfigUpdateSchema = z.object({
  config: z.object({
    name: z.string().min(1).max(100).optional(),
    culturalEntropy: z.number().min(0).max(1).optional(),
    beliefPlasticity: z.number().min(0).max(1).optional(),
    crisisFrequency: z.number().min(0).max(1).optional(),
    authoritySkepticismIndex: z.number().min(0).max(1).optional(),
  }),
});

// GET: Get current world configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return errorResponse("World not found", "NOT_FOUND", 404);
    }

    const world = worldResult[0];

    return NextResponse.json({
      config: world.config,
      instability: world.instability,
      instabilityTrend: world.instabilityTrend,
      manifestCount: world.manifestCount,
      tick: world.tick,
      status: world.status,
    });
  } catch (error) {
    console.error("GET /api/world/[worldId]/config error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// PATCH: Update world configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    const body = await request.json();
    const validationResult = ConfigUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid configuration data", "VALIDATION_ERROR", 400);
    }

    // Fetch current world
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return errorResponse("World not found", "NOT_FOUND", 404);
    }

    const currentWorld = worldResult[0];
    const currentConfig = currentWorld.config as Record<string, unknown>;
    const updates = validationResult.data.config;

    // Merge with existing config (only update provided fields)
    const newConfig = {
      ...currentConfig,
      ...updates,
    };

    // Update the world
    await db
      .update(worlds)
      .set({
        name: updates.name || currentWorld.name,
        config: newConfig,
        updatedAt: new Date(),
      })
      .where(eq(worlds.id, worldId));

    return NextResponse.json({
      success: true,
      config: newConfig,
    });
  } catch (error) {
    console.error("PATCH /api/world/[worldId]/config error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
