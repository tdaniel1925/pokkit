/**
 * Divine Inbox Engine
 * From PRD PROMPT 9: Divine Inbox (Prayers / Accusations / Questions)
 *
 * Not all citizen messages to "God" are shown.
 * Creates a curated filter system based on:
 * - Citizen curiosity about divinity > threshold
 * - Crisis event happened
 * - Direct mention of God keyword
 */

import type { Citizen } from "@/types/citizen";
import type { WorldState, WorldFeedItem } from "@/types/world";
import type {
  DivineInboxItem,
  InboxItemCategory,
  InboxSurfaceReason,
  InboxFilterOptions,
  InboxSummary,
} from "@/types/divine";
import {
  shouldSurfaceToInbox,
  categorizeInboxContent,
} from "@/types/divine";

// Re-export helper functions from types
export { shouldSurfaceToInbox, categorizeInboxContent } from "@/types/divine";

/**
 * Process a feed item and determine if it should surface to divine inbox
 */
export function processForInbox(
  feedItem: WorldFeedItem,
  citizen: Citizen,
  world: WorldState,
  recentCrisis: boolean
): DivineInboxItem | null {
  // Use the helper function from types
  const { shouldSurface, reasons, relevance } = shouldSurfaceToInbox(
    feedItem.content,
    {
      curiosityAboutDivinity: citizen.attributes.curiosityAboutDivinity,
      trustInGod: citizen.state.trustInGod,
      mood: citizen.state.mood,
      stress: citizen.state.stress,
    },
    {
      recentCrisis,
      tick: world.tick,
    }
  );

  if (!shouldSurface) {
    return null;
  }

  // Categorize the content
  const category = categorizeInboxContent(feedItem.content);

  // Create excerpt (first 100 chars)
  const excerpt =
    feedItem.content.length > 100
      ? feedItem.content.slice(0, 100) + "..."
      : feedItem.content;

  return {
    id: crypto.randomUUID(),
    worldId: world.id,
    citizenId: citizen.id,
    sourceType: "post",
    sourceId: feedItem.id,
    excerpt,
    fullContent: feedItem.content,
    category,
    surfaceReasons: reasons,
    relevanceScore: relevance,
    citizenTrustInGod: citizen.state.trustInGod,
    citizenMood: citizen.state.mood,
    citizenStress: citizen.state.stress,
    tick: world.tick,
    createdAt: new Date(),
  };
}

/**
 * Filter inbox items based on options
 */
export function filterInboxItems(
  items: DivineInboxItem[],
  options: InboxFilterOptions
): DivineInboxItem[] {
  let filtered = [...items];

  // Filter by category
  if (options.categories && options.categories.length > 0) {
    filtered = filtered.filter((item) =>
      options.categories!.includes(item.category)
    );
  }

  // Filter unread only
  if (options.unreadOnly) {
    filtered = filtered.filter((item) => !item.seenAt);
  }

  // Filter by minimum relevance
  if (options.minRelevance !== undefined) {
    filtered = filtered.filter(
      (item) => item.relevanceScore >= options.minRelevance!
    );
  }

  // Filter by citizen
  if (options.citizenId) {
    filtered = filtered.filter((item) => item.citizenId === options.citizenId);
  }

  // Sort by relevance (highest first), then by date (newest first)
  filtered.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Apply limit
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Calculate inbox summary statistics
 */
export function calculateInboxSummary(items: DivineInboxItem[]): InboxSummary {
  const unread = items.filter((item) => !item.seenAt);

  // Count by category
  const byCategory = {} as Record<InboxItemCategory, number>;
  const categories: InboxItemCategory[] = [
    "prayer",
    "question",
    "accusation",
    "praise",
    "crisis_call",
    "doubt",
    "testimony",
  ];

  for (const cat of categories) {
    byCategory[cat] = items.filter((item) => item.category === cat).length;
  }

  // Calculate average relevance
  const avgRelevance =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.relevanceScore, 0) / items.length
      : 0;

  // Find oldest unread
  const oldestUnread = unread.length > 0
    ? unread.reduce((oldest, item) =>
        item.createdAt < oldest.createdAt ? item : oldest
      ).createdAt
    : undefined;

  return {
    total: items.length,
    unread: unread.length,
    byCategory,
    avgRelevance,
    oldestUnread,
  };
}

/**
 * Mark inbox items as seen
 */
export function markAsSeen(
  items: DivineInboxItem[],
  itemIds: string[]
): DivineInboxItem[] {
  const now = new Date();
  return items.map((item) => {
    if (itemIds.includes(item.id) && !item.seenAt) {
      return { ...item, seenAt: now };
    }
    return item;
  });
}

/**
 * Mark inbox item as responded to
 */
export function markAsResponded(
  item: DivineInboxItem,
  whisperId: string
): DivineInboxItem {
  return {
    ...item,
    respondedAt: new Date(),
    responseWhisperId: whisperId,
    seenAt: item.seenAt || new Date(),
  };
}

/**
 * Get priority inbox items (high relevance, unread, crisis-related)
 */
export function getPriorityItems(
  items: DivineInboxItem[],
  limit: number = 5
): DivineInboxItem[] {
  // Priority criteria:
  // 1. Crisis calls (always high priority)
  // 2. High relevance (> 0.7)
  // 3. Unread
  // 4. Recent (within last 10 ticks)

  return items
    .filter((item) => !item.seenAt || item.category === "crisis_call")
    .sort((a, b) => {
      // Crisis calls first
      if (a.category === "crisis_call" && b.category !== "crisis_call") return -1;
      if (b.category === "crisis_call" && a.category !== "crisis_call") return 1;

      // Then by relevance
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Then by date
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, limit);
}

/**
 * Get suggested response tone for an inbox item
 */
export function suggestResponseTone(
  item: DivineInboxItem
): "gentle" | "comforting" | "questioning" | "warning" | "mysterious" {
  switch (item.category) {
    case "crisis_call":
      return "comforting";
    case "accusation":
      return "gentle"; // Respond to accusations with gentleness
    case "doubt":
      return "mysterious"; // Let them find their own way
    case "question":
      return "questioning"; // Answer questions with questions
    case "praise":
      return "gentle";
    case "prayer":
      return item.citizenStress > 0.5 ? "comforting" : "gentle";
    case "testimony":
      return "mysterious";
    default:
      return "gentle";
  }
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: InboxItemCategory): string {
  const labels: Record<InboxItemCategory, string> = {
    prayer: "Prayer",
    question: "Question",
    accusation: "Accusation",
    praise: "Praise",
    crisis_call: "Crisis Call",
    doubt: "Doubt",
    testimony: "Testimony",
  };
  return labels[category];
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(category: InboxItemCategory): string {
  const emojis: Record<InboxItemCategory, string> = {
    prayer: "🙏",
    question: "❓",
    accusation: "😠",
    praise: "✨",
    crisis_call: "🆘",
    doubt: "🤔",
    testimony: "📜",
  };
  return emojis[category];
}
