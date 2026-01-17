/**
 * Create Life API - Spawns initial citizens in a world
 * This is called after the user has configured their world parameters
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { worlds, citizens, citizenBeliefs, worldFeedItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { initializeWorld } from "@/lib/simulation";
import type { WorldState } from "@/types/world";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Get the world
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return NextResponse.json({ error: "World not found" }, { status: 404 });
    }

    const worldRecord = worldResult[0];

    // Check if life already exists
    const existingCitizens = await db
      .select()
      .from(citizens)
      .where(eq(citizens.worldId, worldId))
      .limit(1);

    if (existingCitizens.length > 0) {
      return NextResponse.json(
        { error: "Life already exists in this world" },
        { status: 400 }
      );
    }

    // Convert to WorldState for initialization
    const world: WorldState = {
      id: worldRecord.id,
      userId: worldRecord.userId,
      config: worldRecord.config as WorldState["config"],
      tick: worldRecord.tick,
      status: worldRecord.status,
      createdAt: worldRecord.createdAt,
      updatedAt: worldRecord.updatedAt,
    };

    // Initialize citizens
    const { citizens: initialCitizens } = initializeWorld(world);

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

    // Create a feed item for the creation event
    await db.insert(worldFeedItems).values({
      worldId: worldId,
      tick: 0,
      type: "divine_event",
      content: `In the beginning, ${initialCitizens.length} souls emerged from the void. The world awakens.`,
      metadata: { event: "creation", citizenCount: initialCitizens.length },
    });

    // Update world tick to 1 (life has begun)
    await db
      .update(worlds)
      .set({
        tick: 1,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(worlds.id, worldId));

    return NextResponse.json({
      success: true,
      citizenCount: initialCitizens.length,
      message: "Life has begun",
    });
  } catch (error) {
    console.error("Failed to create life:", error);
    return NextResponse.json(
      { error: "Failed to create life" },
      { status: 500 }
    );
  }
}
