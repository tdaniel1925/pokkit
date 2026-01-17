/**
 * Divine Inbox API Route
 * From PRD PROMPT 9: Divine Inbox (Prayers / Accusations / Questions)
 *
 * GET: Get inbox items with filtering
 * POST: Mark items as seen or process new content for inbox
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  divineInboxItems,
  citizens,
  worlds,
  worldFeedItems,
} from "@/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import {
  filterInboxItems,
  calculateInboxSummary,
  getPriorityItems,
  suggestResponseTone,
  getCategoryLabel,
} from "@/lib/divine-inbox";
import type { DivineInboxItem, InboxItemCategory, InboxSurfaceReason } from "@/types/divine";

// Error response helper
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

// GET: Get inbox items
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
    const view = searchParams.get("view") || "all"; // all, priority, unread
    const category = searchParams.get("category") as InboxItemCategory | null;
    const citizenId = searchParams.get("citizenId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Fetch world to verify it exists
    const worldResult = await db
      .select()
      .from(worlds)
      .where(eq(worlds.id, worldId))
      .limit(1);

    if (worldResult.length === 0) {
      return errorResponse("World not found", "NOT_FOUND", 404);
    }

    // Fetch inbox items
    const itemRows = await db
      .select()
      .from(divineInboxItems)
      .where(eq(divineInboxItems.worldId, worldId))
      .orderBy(desc(divineInboxItems.createdAt))
      .limit(limit * 2); // Fetch more for filtering

    // Convert to DivineInboxItem type
    const items: DivineInboxItem[] = itemRows.map((row) => ({
      id: row.id,
      worldId: row.worldId,
      citizenId: row.citizenId,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      excerpt: row.excerpt,
      fullContent: row.fullContent,
      category: row.category,
      surfaceReasons: row.surfaceReasons as InboxSurfaceReason[],
      relevanceScore: row.relevanceScore,
      citizenTrustInGod: row.citizenTrustInGod,
      citizenMood: row.citizenMood,
      citizenStress: row.citizenStress,
      tick: row.tick,
      seenAt: row.seenAt ?? undefined,
      respondedAt: row.respondedAt ?? undefined,
      responseWhisperId: row.responseWhisperId ?? undefined,
      createdAt: row.createdAt,
    }));

    let filteredItems: DivineInboxItem[];

    switch (view) {
      case "priority":
        filteredItems = getPriorityItems(items, limit);
        break;
      case "unread":
        filteredItems = filterInboxItems(items, {
          unreadOnly: true,
          categories: category ? [category] : undefined,
          citizenId: citizenId ?? undefined,
          limit,
        });
        break;
      default:
        filteredItems = filterInboxItems(items, {
          categories: category ? [category] : undefined,
          citizenId: citizenId ?? undefined,
          limit,
        });
    }

    // Calculate summary
    const summary = calculateInboxSummary(items);

    // Fetch citizen names for display
    const citizenIds = [...new Set(filteredItems.map((i) => i.citizenId))];
    const citizenRows = citizenIds.length > 0
      ? await db
          .select({ id: citizens.id, name: citizens.name })
          .from(citizens)
          .where(eq(citizens.worldId, worldId))
      : [];

    const citizenMap = new Map(citizenRows.map((c) => [c.id, c.name]));

    // Enrich items with citizen names and suggested response tone
    const enrichedItems = filteredItems.map((item) => ({
      ...item,
      citizenName: citizenMap.get(item.citizenId) || "Unknown",
      categoryLabel: getCategoryLabel(item.category),
      suggestedTone: suggestResponseTone(item),
    }));

    return NextResponse.json({
      items: enrichedItems,
      summary,
      view,
    });
  } catch (error) {
    console.error("GET /api/world/[worldId]/inbox error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// POST action schemas
const MarkSeenSchema = z.object({
  action: z.literal("mark_seen"),
  itemIds: z.array(z.string().uuid()),
});

const MarkAllSeenSchema = z.object({
  action: z.literal("mark_all_seen"),
});

const ProcessContentSchema = z.object({
  action: z.literal("process"),
  feedItemId: z.string().uuid(),
});

const PostActionSchema = z.discriminatedUnion("action", [
  MarkSeenSchema,
  MarkAllSeenSchema,
  ProcessContentSchema,
]);

// POST: Perform inbox actions
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
    const validationResult = PostActionSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse("Invalid request data", "VALIDATION_ERROR", 400);
    }

    const data = validationResult.data;

    switch (data.action) {
      case "mark_seen": {
        const now = new Date();
        let updatedCount = 0;

        for (const itemId of data.itemIds) {
          const result = await db
            .update(divineInboxItems)
            .set({ seenAt: now })
            .where(
              and(
                eq(divineInboxItems.id, itemId),
                eq(divineInboxItems.worldId, worldId),
                isNull(divineInboxItems.seenAt)
              )
            );
          updatedCount++;
        }

        return NextResponse.json({
          success: true,
          action: "mark_seen",
          updatedCount,
        });
      }

      case "mark_all_seen": {
        const now = new Date();
        await db
          .update(divineInboxItems)
          .set({ seenAt: now })
          .where(
            and(
              eq(divineInboxItems.worldId, worldId),
              isNull(divineInboxItems.seenAt)
            )
          );

        return NextResponse.json({
          success: true,
          action: "mark_all_seen",
        });
      }

      case "process": {
        // Process a feed item for potential inbox surfacing
        // This is called when new feed items are created

        // Fetch the feed item
        const feedItemResult = await db
          .select()
          .from(worldFeedItems)
          .where(eq(worldFeedItems.id, data.feedItemId))
          .limit(1);

        if (feedItemResult.length === 0) {
          return errorResponse("Feed item not found", "NOT_FOUND", 404);
        }

        const feedItem = feedItemResult[0];

        // Only process citizen posts
        if (!feedItem.citizenId) {
          return NextResponse.json({
            success: true,
            action: "process",
            surfaced: false,
            reason: "Not a citizen post",
          });
        }

        // Fetch the citizen
        const citizenResult = await db
          .select()
          .from(citizens)
          .where(eq(citizens.id, feedItem.citizenId))
          .limit(1);

        if (citizenResult.length === 0) {
          return NextResponse.json({
            success: true,
            action: "process",
            surfaced: false,
            reason: "Citizen not found",
          });
        }

        const citizen = citizenResult[0];

        // Fetch world for tick
        const worldResult = await db
          .select()
          .from(worlds)
          .where(eq(worlds.id, worldId))
          .limit(1);

        if (worldResult.length === 0) {
          return errorResponse("World not found", "NOT_FOUND", 404);
        }

        const world = worldResult[0];

        // Import and use the processing function
        const { processForInbox } = await import("@/lib/divine-inbox");
        const { shouldSurfaceToInbox, categorizeInboxContent } = await import(
          "@/types/divine"
        );

        const citizenState = citizen.state as {
          mood: number;
          stress: number;
          trustInGod: number;
        };
        const citizenAttrs = citizen.attributes as {
          curiosityAboutDivinity: number;
        };

        // Check if it should surface
        const { shouldSurface, reasons, relevance } = shouldSurfaceToInbox(
          feedItem.content,
          {
            curiosityAboutDivinity: citizenAttrs.curiosityAboutDivinity,
            trustInGod: citizenState.trustInGod,
            mood: citizenState.mood,
            stress: citizenState.stress,
          },
          {
            recentCrisis: false, // TODO: check for recent crisis
            tick: world.tick,
          }
        );

        if (!shouldSurface) {
          return NextResponse.json({
            success: true,
            action: "process",
            surfaced: false,
            reason: "Did not meet surfacing criteria",
          });
        }

        // Create inbox item
        const category = categorizeInboxContent(feedItem.content);
        const excerpt =
          feedItem.content.length > 100
            ? feedItem.content.slice(0, 100) + "..."
            : feedItem.content;

        await db.insert(divineInboxItems).values({
          worldId,
          citizenId: citizen.id,
          sourceType: "post",
          sourceId: feedItem.id,
          excerpt,
          fullContent: feedItem.content,
          category,
          surfaceReasons: reasons,
          relevanceScore: relevance,
          citizenTrustInGod: citizenState.trustInGod,
          citizenMood: citizenState.mood,
          citizenStress: citizenState.stress,
          tick: world.tick,
        });

        return NextResponse.json({
          success: true,
          action: "process",
          surfaced: true,
          category,
          relevance,
          reasons,
        });
      }

      default:
        return errorResponse("Unknown action", "UNKNOWN_ACTION", 400);
    }
  } catch (error) {
    console.error("POST /api/world/[worldId]/inbox error:", error);
    return errorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
