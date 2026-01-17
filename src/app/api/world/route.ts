/**
 * World API Routes - Multi-World Support
 * POST: Create a new empty world (no citizens yet)
 * GET: List user's worlds
 */

import { NextRequest, NextResponse } from "next/server";
import { WorldConfigSchema } from "@/types/world";
import { createWorld, validateWorldConfig } from "@/lib/simulation";
import { db } from "@/db";
import { worlds, citizens } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * POST /api/world
 * Create a new EMPTY world (no citizens yet - they are created via create-life endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    const body = await request.json();

    // Validate configuration
    const parseResult = WorldConfigSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(
        "Invalid world configuration",
        "VALIDATION_ERROR",
        400
      );
    }

    const config = parseResult.data;
    const validation = validateWorldConfig(config);
    if (!validation.valid) {
      return errorResponse(
        `Invalid configuration: ${validation.errors.join(", ")}`,
        "VALIDATION_ERROR",
        400
      );
    }

    // TODO: Get actual user ID from auth
    const userId = "00000000-0000-0000-0000-000000000001"; // Demo user UUID

    // Create world using simulation library (but DON'T initialize citizens yet)
    const world = createWorld(userId, config);

    // Save world to database (empty - no citizens)
    const [worldRecord] = await db
      .insert(worlds)
      .values({
        id: world.id,
        userId: world.userId,
        name: world.config.name,
        config: world.config,
        tick: 0, // Tick 0 = before creation
        status: "paused", // Paused until life is created
        presenceMode: "observer",
        instability: 0,
        instabilityTrend: "stable",
        manifestCount: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      worldId: worldRecord.id,
      name: worldRecord.name,
      config: worldRecord.config,
      // No citizenCount - world is empty
    });
  } catch (error) {
    console.error("POST /api/world error:", error);
    return errorResponse("Failed to create world", "INTERNAL_ERROR", 500);
  }
}

/**
 * GET /api/world
 * List all worlds for the current user
 */
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return errorResponse("Database not available", "DB_ERROR", 503);
    }

    // TODO: Get actual user ID from auth
    const userId = "00000000-0000-0000-0000-000000000001"; // Demo user UUID

    // Fetch user's worlds with basic stats
    const userWorlds = await db
      .select({
        id: worlds.id,
        name: worlds.name,
        config: worlds.config,
        tick: worlds.tick,
        status: worlds.status,
        presenceMode: worlds.presenceMode,
        instability: worlds.instability,
        instabilityTrend: worlds.instabilityTrend,
        manifestCount: worlds.manifestCount,
        createdAt: worlds.createdAt,
        updatedAt: worlds.updatedAt,
      })
      .from(worlds)
      .where(eq(worlds.userId, userId))
      .orderBy(desc(worlds.updatedAt));

    // Get citizen counts for each world
    const worldsWithStats = await Promise.all(
      userWorlds.map(async (world) => {
        const citizenCount = await db!
          .select()
          .from(citizens)
          .where(eq(citizens.worldId, world.id));

        return {
          ...world,
          citizenCount: citizenCount.length,
        };
      })
    );

    return NextResponse.json({
      worlds: worldsWithStats,
      total: worldsWithStats.length,
    });
  } catch (error) {
    console.error("GET /api/world error:", error);
    return errorResponse("Failed to list worlds", "INTERNAL_ERROR", 500);
  }
}
