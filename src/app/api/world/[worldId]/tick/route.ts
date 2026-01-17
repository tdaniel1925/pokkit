import { NextRequest, NextResponse } from "next/server";
import { processSimulationTick, type SimulationContext } from "@/lib/simulation";
import type { DivineAction } from "@/types/guardrails";
// import { db, worlds, citizens, citizenMemories, worldFeedItems } from "@/db";
// import { eq } from "drizzle-orm";

/**
 * POST /api/world/[worldId]/tick
 * Advance the world simulation by one tick
 *
 * Body (optional):
 * - divineAction: DivineAction to execute during this tick
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ worldId: string }> }
) {
  try {
    const { worldId } = await params;
    const body = await request.json().catch(() => ({}));
    const divineAction = body.divineAction as DivineAction | undefined;

    // TODO: Load from database
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
    // const memories = new Map();
    // for (const citizen of worldCitizens) {
    //   const citizenMems = await db.query.citizenMemories.findMany({
    //     where: eq(citizenMemories.citizenId, citizen.id),
    //   });
    //   memories.set(citizen.id, citizenMems);
    // }

    // For now, return a mock response
    // In production, this would call processSimulationTick

    // const context: SimulationContext = {
    //   world,
    //   citizens: worldCitizens,
    //   memories,
    //   pendingDivineAction: divineAction,
    // };
    //
    // const result = await processSimulationTick(context);
    //
    // // Save updates to database
    // await db.update(worlds)
    //   .set({ tick: result.worldState.tick, updatedAt: new Date() })
    //   .where(eq(worlds.id, worldId));
    //
    // // Insert feed items
    // for (const item of result.newFeedItems) {
    //   await db.insert(worldFeedItems).values(item);
    // }
    //
    // // Update citizens
    // for (const [citizenId, updates] of result.citizenUpdates) {
    //   await db.update(citizens)
    //     .set(updates)
    //     .where(eq(citizens.id, citizenId));
    // }

    return NextResponse.json({
      success: true,
      tick: 1, // Would be result.worldState.tick
      newFeedItems: [],
      divineActionResult: divineAction ? {
        action: divineAction,
        success: true,
        message: "Divine action processed through guardrails",
      } : undefined,
    });
  } catch (error) {
    console.error("Failed to process tick:", error);
    return NextResponse.json(
      { error: "Failed to process simulation tick" },
      { status: 500 }
    );
  }
}
