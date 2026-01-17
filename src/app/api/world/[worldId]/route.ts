import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { worlds, citizens, worldFeedItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/world/[worldId]
 * Get world details with recent feed and citizens
 */
export async function GET(
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

    const world = worldResult[0];

    // Get citizens for this world
    const worldCitizens = await db
      .select()
      .from(citizens)
      .where(eq(citizens.worldId, worldId));

    // Get recent feed items
    const feedItems = await db
      .select()
      .from(worldFeedItems)
      .where(eq(worldFeedItems.worldId, worldId))
      .orderBy(desc(worldFeedItems.tick), desc(worldFeedItems.createdAt))
      .limit(50);

    // Format the world state
    const worldState = {
      id: world.id,
      userId: world.userId,
      config: world.config,
      tick: world.tick,
      status: world.status,
      presenceMode: world.presenceMode,
      instability: world.instability,
      instabilityTrend: world.instabilityTrend,
      manifestCount: world.manifestCount,
      manifestCooldownUntil: world.manifestCooldownUntil,
      createdAt: world.createdAt,
      updatedAt: world.updatedAt,
    };

    // Format citizens
    const formattedCitizens = worldCitizens.map((c) => ({
      id: c.id,
      worldId: c.worldId,
      name: c.name,
      attributes: c.attributes,
      state: c.state,
      consent: c.consent,
      createdAtTick: c.createdAtTick,
      lastActiveTick: c.lastActiveTick,
    }));

    // Format feed items
    const formattedFeedItems = feedItems.map((f) => ({
      id: f.id,
      worldId: f.worldId,
      tick: f.tick,
      type: f.type,
      citizenId: f.citizenId,
      content: f.content,
      metadata: f.metadata,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({
      world: worldState,
      citizens: formattedCitizens,
      feedItems: formattedFeedItems,
    });
  } catch (error) {
    console.error("Failed to get world:", error);
    return NextResponse.json(
      { error: "Failed to get world" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/world/[worldId]
 * Delete a world
 */
export async function DELETE(
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

    await db.delete(worlds).where(eq(worlds.id, worldId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete world:", error);
    return NextResponse.json(
      { error: "Failed to delete world" },
      { status: 500 }
    );
  }
}
