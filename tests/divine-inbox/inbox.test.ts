/**
 * Divine Inbox Tests - Phase 2.5
 */

import { describe, it, expect } from "vitest";
import {
  shouldSurfaceToInbox,
  categorizeInboxContent,
} from "@/types/divine";
import {
  filterInboxItems,
  calculateInboxSummary,
  getPriorityItems,
  suggestResponseTone,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/divine-inbox/inbox";
import type { DivineInboxItem, InboxItemCategory } from "@/types/divine";

function createTestInboxItem(
  id: string,
  overrides: Partial<DivineInboxItem> = {}
): DivineInboxItem {
  return {
    id,
    worldId: "world-1",
    citizenId: "citizen-1",
    sourceType: "post",
    sourceId: "source-1",
    excerpt: "Test excerpt",
    fullContent: "Test full content",
    category: "prayer",
    surfaceReasons: ["direct_mention"],
    relevanceScore: 0.5,
    citizenTrustInGod: 0.5,
    citizenMood: 0,
    citizenStress: 0.3,
    tick: 100,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("shouldSurfaceToInbox", () => {
  const defaultCitizenState = {
    curiosityAboutDivinity: 0.5,
    trustInGod: 0.5,
    mood: 0,
    stress: 0.3,
  };

  const defaultWorldContext = {
    recentCrisis: false,
    tick: 100,
  };

  it("should surface content with direct divine mentions", () => {
    const result = shouldSurfaceToInbox(
      "Please God, help me understand",
      defaultCitizenState,
      defaultWorldContext
    );

    expect(result.shouldSurface).toBe(true);
    expect(result.reasons).toContain("direct_mention");
    expect(result.relevance).toBeGreaterThan(0.3);
  });

  it("should surface content from highly curious citizens with divine context", () => {
    const result = shouldSurfaceToInbox(
      "I wonder if the divine has a plan for us all",
      { ...defaultCitizenState, curiosityAboutDivinity: 0.8 },
      defaultWorldContext
    );

    expect(result.shouldSurface).toBe(true);
    expect(result.reasons).toContain("high_divinity_curiosity");
  });

  it("should surface crisis-related content", () => {
    const result = shouldSurfaceToInbox(
      "Everything is falling apart",
      { ...defaultCitizenState, stress: 0.7 },
      { ...defaultWorldContext, recentCrisis: true }
    );

    expect(result.shouldSurface).toBe(true);
    expect(result.reasons).toContain("crisis_related");
  });

  it("should not surface mundane content from non-curious citizens", () => {
    const result = shouldSurfaceToInbox(
      "The weather is nice today",
      { ...defaultCitizenState, curiosityAboutDivinity: 0.2 },
      defaultWorldContext
    );

    expect(result.shouldSurface).toBe(false);
  });

  it("should surface highly emotional content with divine appeal", () => {
    const result = shouldSurfaceToInbox(
      "Why, God, must we suffer so much?",
      { ...defaultCitizenState, mood: -0.5, stress: 0.8 },
      defaultWorldContext
    );

    expect(result.shouldSurface).toBe(true);
    expect(result.reasons).toContain("direct_mention");
  });
});

describe("categorizeInboxContent", () => {
  it("should categorize prayers correctly", () => {
    expect(categorizeInboxContent("Please help me find my way")).toBe("prayer");
    expect(categorizeInboxContent("I pray for guidance")).toBe("prayer");
  });

  it("should categorize accusations correctly", () => {
    expect(categorizeInboxContent("Why did you let this happen?")).toBe(
      "accusation"
    );
    expect(categorizeInboxContent("How could you allow such suffering?")).toBe(
      "accusation"
    );
  });

  it("should categorize questions correctly", () => {
    expect(categorizeInboxContent("Are you real?")).toBe("question");
    expect(categorizeInboxContent("Do you exist?")).toBe("question");
  });

  it("should categorize crisis calls correctly", () => {
    expect(categorizeInboxContent("Help me, I have no hope left")).toBe(
      "crisis_call"
    );
    expect(categorizeInboxContent("Save us from this desperate situation")).toBe(
      "crisis_call"
    );
  });

  it("should categorize praise correctly", () => {
    expect(categorizeInboxContent("Thank you for this blessing")).toBe("praise");
    expect(categorizeInboxContent("I am so grateful")).toBe("praise");
  });

  it("should categorize doubt correctly", () => {
    expect(categorizeInboxContent("I'm beginning to question everything")).toBe(
      "doubt"
    );
    expect(categorizeInboxContent("Maybe there is no higher power")).toBe(
      "doubt"
    );
  });

  it("should categorize testimony correctly", () => {
    expect(categorizeInboxContent("I saw a sign yesterday")).toBe("testimony");
    expect(categorizeInboxContent("I felt something divine")).toBe("testimony");
  });
});

describe("filterInboxItems", () => {
  const items: DivineInboxItem[] = [
    createTestInboxItem("1", { category: "prayer", relevanceScore: 0.8 }),
    createTestInboxItem("2", {
      category: "crisis_call",
      relevanceScore: 0.9,
      seenAt: new Date(),
    }),
    createTestInboxItem("3", { category: "question", relevanceScore: 0.4 }),
    createTestInboxItem("4", { category: "prayer", relevanceScore: 0.6 }),
  ];

  it("should filter by category", () => {
    const filtered = filterInboxItems(items, { categories: ["prayer"] });
    expect(filtered.length).toBe(2);
    expect(filtered.every((i) => i.category === "prayer")).toBe(true);
  });

  it("should filter unread only", () => {
    const filtered = filterInboxItems(items, { unreadOnly: true });
    expect(filtered.length).toBe(3);
    expect(filtered.every((i) => !i.seenAt)).toBe(true);
  });

  it("should filter by minimum relevance", () => {
    const filtered = filterInboxItems(items, { minRelevance: 0.5 });
    expect(filtered.length).toBe(3);
    expect(filtered.every((i) => i.relevanceScore >= 0.5)).toBe(true);
  });

  it("should apply limit", () => {
    const filtered = filterInboxItems(items, { limit: 2 });
    expect(filtered.length).toBe(2);
  });

  it("should sort by relevance", () => {
    const filtered = filterInboxItems(items, {});
    expect(filtered[0].relevanceScore).toBeGreaterThanOrEqual(
      filtered[1].relevanceScore
    );
  });
});

describe("calculateInboxSummary", () => {
  const items: DivineInboxItem[] = [
    createTestInboxItem("1", { category: "prayer" }),
    createTestInboxItem("2", { category: "prayer", seenAt: new Date() }),
    createTestInboxItem("3", { category: "crisis_call" }),
    createTestInboxItem("4", { category: "question" }),
  ];

  it("should calculate total correctly", () => {
    const summary = calculateInboxSummary(items);
    expect(summary.total).toBe(4);
  });

  it("should calculate unread correctly", () => {
    const summary = calculateInboxSummary(items);
    expect(summary.unread).toBe(3);
  });

  it("should count by category", () => {
    const summary = calculateInboxSummary(items);
    expect(summary.byCategory.prayer).toBe(2);
    expect(summary.byCategory.crisis_call).toBe(1);
    expect(summary.byCategory.question).toBe(1);
  });

  it("should handle empty list", () => {
    const summary = calculateInboxSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.unread).toBe(0);
    expect(summary.avgRelevance).toBe(0);
  });
});

describe("getPriorityItems", () => {
  const items: DivineInboxItem[] = [
    createTestInboxItem("1", { category: "prayer", relevanceScore: 0.4 }),
    createTestInboxItem("2", { category: "crisis_call", relevanceScore: 0.7 }),
    createTestInboxItem("3", { category: "question", relevanceScore: 0.9 }),
    createTestInboxItem("4", {
      category: "prayer",
      relevanceScore: 0.5,
      seenAt: new Date(),
    }),
  ];

  it("should prioritize crisis calls", () => {
    const priority = getPriorityItems(items, 5);
    expect(priority[0].category).toBe("crisis_call");
  });

  it("should respect limit", () => {
    const priority = getPriorityItems(items, 2);
    expect(priority.length).toBe(2);
  });

  it("should sort by relevance after crisis", () => {
    const priority = getPriorityItems(items, 5);
    // After crisis_call, should be sorted by relevance
    const nonCrisis = priority.filter((i) => i.category !== "crisis_call");
    for (let i = 0; i < nonCrisis.length - 1; i++) {
      expect(nonCrisis[i].relevanceScore).toBeGreaterThanOrEqual(
        nonCrisis[i + 1].relevanceScore
      );
    }
  });
});

describe("suggestResponseTone", () => {
  it("should suggest comforting for crisis calls", () => {
    const item = createTestInboxItem("1", { category: "crisis_call" });
    expect(suggestResponseTone(item)).toBe("comforting");
  });

  it("should suggest gentle for accusations", () => {
    const item = createTestInboxItem("1", { category: "accusation" });
    expect(suggestResponseTone(item)).toBe("gentle");
  });

  it("should suggest mysterious for doubt", () => {
    const item = createTestInboxItem("1", { category: "doubt" });
    expect(suggestResponseTone(item)).toBe("mysterious");
  });

  it("should suggest questioning for questions", () => {
    const item = createTestInboxItem("1", { category: "question" });
    expect(suggestResponseTone(item)).toBe("questioning");
  });

  it("should suggest comforting for stressed prayers", () => {
    const item = createTestInboxItem("1", {
      category: "prayer",
      citizenStress: 0.7,
    });
    expect(suggestResponseTone(item)).toBe("comforting");
  });
});

describe("getCategoryLabel", () => {
  it("should return correct labels", () => {
    expect(getCategoryLabel("prayer")).toBe("Prayer");
    expect(getCategoryLabel("crisis_call")).toBe("Crisis Call");
    expect(getCategoryLabel("accusation")).toBe("Accusation");
  });
});

describe("getCategoryEmoji", () => {
  it("should return correct emojis", () => {
    expect(getCategoryEmoji("prayer")).toBe("🙏");
    expect(getCategoryEmoji("crisis_call")).toBe("🆘");
    expect(getCategoryEmoji("question")).toBe("❓");
  });
});
