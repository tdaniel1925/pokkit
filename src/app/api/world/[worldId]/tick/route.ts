import { NextRequest, NextResponse } from "next/server";
import { processSimulationTick, type SimulationContext } from "@/lib/simulation";
import type { DivineAction } from "@/types/guardrails";
import { db } from "@/db";
import { worlds, citizens, citizenMemories, worldFeedItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { WorldState } from "@/types/world";
import type { Citizen, CitizenMemory } from "@/types/citizen";

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

    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Load world from database
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return NextResponse.json({ error: "World not found" }, { status: 404 });
    }

    const worldRecord = worldResult[0];

    // Convert to WorldState type
    const world: WorldState = {
      id: worldRecord.id,
      userId: worldRecord.userId,
      config: worldRecord.config as WorldState["config"],
      tick: worldRecord.tick,
      status: worldRecord.status,
      createdAt: worldRecord.createdAt,
      updatedAt: worldRecord.updatedAt,
    };

    // Load citizens
    const citizenRecords = await db
      .select()
      .from(citizens)
      .where(eq(citizens.worldId, worldId));

    const worldCitizens: Citizen[] = citizenRecords.map((c) => ({
      id: c.id,
      worldId: c.worldId,
      name: c.name,
      attributes: c.attributes as Citizen["attributes"],
      state: c.state as Citizen["state"],
      consent: c.consent as Citizen["consent"],
      beliefs: [], // Will be loaded separately if needed
      memories: [], // Will be loaded separately
      createdAtTick: c.createdAtTick,
      lastActiveTick: c.lastActiveTick,
    }));

    // Load memories for each citizen
    const memories = new Map<string, CitizenMemory[]>();
    for (const citizen of worldCitizens) {
      const citizenMems = await db
        .select()
        .from(citizenMemories)
        .where(eq(citizenMemories.citizenId, citizen.id));

      memories.set(
        citizen.id,
        citizenMems.map((m) => ({
          id: m.id,
          citizenId: m.citizenId,
          type: m.type,
          content: m.content,
          emotionalWeight: m.emotionalWeight,
          importance: m.importance,
          tick: m.tick,
          decayRate: m.decayRate,
          isDivine: m.isDivine,
        }))
      );
    }

    // Build simulation context
    const context: SimulationContext = {
      world,
      citizens: worldCitizens,
      memories,
      pendingDivineAction: divineAction,
    };

    // Process simulation tick
    const result = await processSimulationTick(context);

    // Save world updates to database
    await db
      .update(worlds)
      .set({
        tick: result.worldState.tick,
        updatedAt: new Date(),
      })
      .where(eq(worlds.id, worldId));

    // Insert feed items
    for (const item of result.newFeedItems) {
      await db.insert(worldFeedItems).values({
        id: item.id,
        worldId: item.worldId,
        tick: item.tick,
        type: item.type,
        citizenId: item.citizenId,
        content: item.content,
        metadata: item.metadata,
      });
    }

    // Update citizens
    for (const [citizenId, updates] of result.citizenUpdates) {
      await db
        .update(citizens)
        .set({
          state: updates.state,
          lastActiveTick: result.worldState.tick,
          updatedAt: new Date(),
        })
        .where(eq(citizens.id, citizenId));
    }

    return NextResponse.json({
      success: true,
      tick: result.worldState.tick,
      newFeedItems: result.newFeedItems,
      divineActionResult: result.divineActionResult,
    });
  } catch (error) {
    console.error("Failed to process tick:", error);
    return NextResponse.json(
      { error: "Failed to process simulation tick" },
      { status: 500 }
    );
  }
}
