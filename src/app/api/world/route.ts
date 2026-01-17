/**
 * World API Routes - Multi-World Support
 * POST: Create a new world
 * GET: List user's worlds
 */

import { NextRequest, NextResponse } from "next/server";
import { WorldConfigSchema } from "@/types/world";
import { createWorld, initializeWorld, validateWorldConfig } from "@/lib/simulation";
import { db } from "@/db";
import { worlds, citizens, citizenBeliefs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * POST /api/world
 * Create a new world with initial population
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

    // Create world using simulation library
    const world = createWorld(userId, config);

    // Initialize with population
    const { citizens: initialCitizens } = initializeWorld(world);

    // Save world to database
    const [worldRecord] = await db
      .insert(worlds)
      .values({
        id: world.id,
        userId: world.userId,
        name: world.config.name,
        config: world.config,
        tick: world.tick,
        status: world.status,
        presenceMode: "observer",
        instability: 0,
        instabilityTrend: "stable",
        manifestCount: 0,
      })
      .returning();

    // Save citizens to database
    for (const citizen of initialCitizens) {
      const [citizenRecord] = await db
        .insert(citizens)
        .values({
          id: citizen.id,
          worldId: citizen.worldId,
          name: citizen.name,
          attributes: citizen.attributes,
          state: citizen.state,
          consent: citizen.consent,
          createdAtTick: citizen.createdAtTick,
          lastActiveTick: citizen.lastActiveTick,
        })
        .returning();

      // Save initial beliefs
      for (const belief of citizen.beliefs) {
        await db.insert(citizenBeliefs).values({
          citizenId: citizenRecord.id,
          topic: belief.topic,
          stance: belief.stance,
          confidence: belief.confidence,
          origin: belief.origin,
          formedAtTick: belief.formedAtTick,
        });
      }
    }

    return NextResponse.json({
      success: true,
      worldId: worldRecord.id,
      name: worldRecord.name,
      citizenCount: initialCitizens.length,
      config: worldRecord.config,
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
