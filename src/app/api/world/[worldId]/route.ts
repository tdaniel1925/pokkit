import { NextRequest, NextResponse } from "next/server";
// import { db, worlds, citizens, worldFeedItems } from "@/db";
// import { eq, desc } from "drizzle-orm";

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

    // TODO: Implement database queries
    // const world = await db.query.worlds.findFirst({
    //   where: eq(worlds.id, worldId),
    // });
    //
    // if (!world) {
    //   return NextResponse.json({ error: "World not found" }, { status: 404 });
    // }
    //
    // const worldCitizens = await db.query.citizens.findMany({
    //   where: eq(citizens.worldId, worldId),
    // });
    //
    // const feedItems = await db.query.worldFeedItems.findMany({
    //   where: eq(worldFeedItems.worldId, worldId),
    //   orderBy: desc(worldFeedItems.tick),
    //   limit: 50,
    // });

    // Return mock data for now
    return NextResponse.json({
      world: {
        id: worldId,
        userId: "demo-user",
        config: {
          name: "Demo World",
          populationSize: 25,
          culturalEntropy: 0.5,
          beliefPlasticity: 0.5,
          crisisFrequency: 0.3,
          authoritySkepticismIndex: 0.5,
        },
        tick: 0,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      citizens: [],
      feedItems: [],
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

    // TODO: Implement database deletion
    // await db.delete(worlds).where(eq(worlds.id, worldId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete world:", error);
    return NextResponse.json(
      { error: "Failed to delete world" },
      { status: 500 }
    );
  }
}
