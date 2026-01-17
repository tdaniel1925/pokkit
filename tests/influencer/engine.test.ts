/**
 * Influencer Engine Tests - Phase 2.5
 */

import { describe, it, expect, vi } from "vitest";
import {
  getInfluenceVerb,
  generateInfluenceMemory,
  isInfluenceOnCooldown,
} from "@/lib/influencer/engine";
import type { WorldFeedItem } from "@/types/world";

// Mock checkGuardrails
vi.mock("@/lib/guardrails", () => ({
  checkGuardrails: vi.fn().mockResolvedValue({
    passed: true,
    warnings: [],
  }),
}));

describe("getInfluenceVerb", () => {
  it("should return 'blessed' for bless type", () => {
    expect(getInfluenceVerb("bless")).toBe("blessed");
  });

  it("should return 'dimmed' for dim type", () => {
    expect(getInfluenceVerb("dim")).toBe("dimmed");
  });
});

describe("generateInfluenceMemory", () => {
  const feedItem: WorldFeedItem = {
    id: "feed-1",
    worldId: "world-1",
    tick: 100,
    type: "citizen_post",
    citizenId: "citizen-1",
    content: "The harvest was good this year, truly we are fortunate.",
    createdAt: new Date(),
  };

  describe("when citizen noticed the influence", () => {
    it("should generate warm memory for blessing", () => {
      const memory = generateInfluenceMemory("bless", feedItem, true);
      expect(memory).toContain("warmth");
      expect(memory).toContain("significant");
    });

    it("should generate fading memory for dimming", () => {
      const memory = generateInfluenceMemory("dim", feedItem, true);
      expect(memory).toContain("fade");
      expect(memory).toContain("less important");
    });
  });

  describe("when citizen did not notice", () => {
    it("should generate lingering thought for blessing", () => {
      const memory = generateInfluenceMemory("bless", feedItem, false);
      expect(memory).toContain("stayed with me");
      expect(memory).toContain("thinking about them");
    });

    it("should generate forgettable memory for dimming", () => {
      const memory = generateInfluenceMemory("dim", feedItem, false);
      expect(memory).toContain("barely remember");
      expect(memory).toContain("didn't seem to matter");
    });
  });

  it("should truncate long content in excerpt", () => {
    const longFeedItem: WorldFeedItem = {
      ...feedItem,
      content: "A".repeat(100),
    };
    const memory = generateInfluenceMemory("bless", longFeedItem, true);
    expect(memory).toContain("...");
  });
});

describe("isInfluenceOnCooldown", () => {
  it("should return false when no previous action", () => {
    expect(isInfluenceOnCooldown(undefined, 100)).toBe(false);
  });

  it("should return true when within cooldown period", () => {
    expect(isInfluenceOnCooldown(98, 100, 3)).toBe(true);
  });

  it("should return false when cooldown has passed", () => {
    expect(isInfluenceOnCooldown(95, 100, 3)).toBe(false);
  });

  it("should return false at exactly cooldown boundary (cooldown just passed)", () => {
    // At tick 100 with lastAction at 97, difference is 3, which equals cooldown
    // So cooldown has just passed (3 < 3 is false)
    expect(isInfluenceOnCooldown(97, 100, 3)).toBe(false);
  });

  it("should return true one tick before cooldown ends", () => {
    // At tick 99 with lastAction at 97, difference is 2, which is less than cooldown 3
    expect(isInfluenceOnCooldown(97, 99, 3)).toBe(true);
  });

  it("should return false just after cooldown", () => {
    expect(isInfluenceOnCooldown(97, 101, 3)).toBe(false);
  });
});
