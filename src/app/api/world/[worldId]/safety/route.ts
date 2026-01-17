/**
 * Safety API Route
 * From PRD PROMPT 11: Safety UI + Reporting + Internal Review Hooks
 *
 * GET: Get safety flags and events for a world
 * POST: Create safety flag (internal use)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { safetyFlags, safetyEvents, worlds } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// GET: Get safety data for a world
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
    const type = searchParams.get("type") || "all"; // flags, events, all
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const unresolvedOnly = searchParams.get("unresolved") === "true";

    // Verify world exists
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return errorResponse("World not found", "NOT_FOUND", 404);
    }

    const response: {
      flags?: Array<Record<string, unknown>>;
      events?: Array<Record<string, unknown>>;
      summary?: {
        totalFlags: number;
        unresolvedFlags: number;
        criticalCount: number;
        highCount: number;
        totalEvents: number;
      };
    } = {};

    if (type === "flags" || type === "all") {
      // Fetch safety flags
      let flagsQuery = db
        .select()
        .from(safetyFlags)
        .where(
          unresolvedOnly
            ? and(
                eq(safetyFlags.worldId, worldId),
                isNull(safetyFlags.resolvedAt)
              )
            : eq(safetyFlags.worldId, worldId)
        )
        .orderBy(desc(safetyFlags.createdAt))
        .limit(limit);

      const flags = await flagsQuery;
      response.flags = flags;

      // Calculate summary
      const allFlags = await db
        .select()
        .from(safetyFlags)
        .where(eq(safetyFlags.worldId, worldId));

      response.summary = {
        totalFlags: allFlags.length,
        unresolvedFlags: allFlags.filter((f) => !f.resolvedAt).length,
        criticalCount: allFlags.filter((f) => f.severity === "critical").length,
        highCount: allFlags.filter((f) => f.severity === "high").length,
        totalEvents: 0,
      };
    }

    if (type === "events" || type === "all") {
      // Fetch safety events
      const events = await db
        .select()
        .from(safetyEvents)
        .where(eq(safetyEvents.worldId, worldId))
        .orderBy(desc(safetyEvents.createdAt))
        .limit(limit);

      response.events = events;

      if (response.summary) {
        response.summary.totalEvents = events.length;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/world/[worldId]/safety error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// Validation schema for creating safety flag
const CreateFlagSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["self_harm", "violence", "coercion", "abuse", "other"]),
  context: z.object({
    summary: z.string().optional(),
    sourceType: z.string().optional(),
  }),
  sourceType: z.string(),
  sourceId: z.string().uuid().optional(),
});

// POST: Create a safety flag (internal use by guardrails)
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
    const validationResult = CreateFlagSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid flag data", "VALIDATION_ERROR", 400);
    }

    const data = validationResult.data;

    // Fetch world
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return errorResponse("World not found", "NOT_FOUND", 404);
    }

    const world = worldResult[0];

    // Create the flag
    const [flag] = await db
      .insert(safetyFlags)
      .values({
        worldId,
        userId: world.userId,
        severity: data.severity,
        category: data.category,
        context: data.context,
        sourceType: data.sourceType,
        sourceId: data.sourceId ?? null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      flag,
    });
  } catch (error) {
    console.error("POST /api/world/[worldId]/safety error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// PATCH: Resolve a safety flag
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
    const { flagId } = body;

    if (!flagId) {
      return errorResponse("Flag ID required", "VALIDATION_ERROR", 400);
    }

    // Update the flag
    await db
      .update(safetyFlags)
      .set({ resolvedAt: new Date() })
      .where(
        and(eq(safetyFlags.id, flagId), eq(safetyFlags.worldId, worldId))
      );

    return NextResponse.json({
      success: true,
      resolved: true,
    });
  } catch (error) {
    console.error("PATCH /api/world/[worldId]/safety error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
