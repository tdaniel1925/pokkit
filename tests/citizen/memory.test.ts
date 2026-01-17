import { describe, it, expect } from "vitest";
import {
  createMemory,
  createDivineMemory,
  processMemoryDecay,
  shouldConvertToLongTerm,
  convertToLongTerm,
  pruneMemories,
  extractMemoryPatterns,
} from "@/lib/ai/citizen/memory";
import type { CitizenMemory } from "@/types/citizen";

describe("Citizen Memory System", () => {
  describe("createMemory", () => {
    it("should create a short-term memory by default", () => {
      const memory = createMemory("citizen-1", "A thought", 10);

      expect(memory.citizenId).toBe("citizen-1");
      expect(memory.content).toBe("A thought");
      expect(memory.tick).toBe(10);
      expect(memory.type).toBe("short_term");
      expect(memory.isDivine).toBe(false);
    });

    it("should create memory with custom options", () => {
      const memory = createMemory("citizen-1", "Important event", 20, {
        type: "long_term",
        emotionalWeight: 0.8,
        importance: 0.9,
      });

      expect(memory.type).toBe("long_term");
      expect(memory.emotionalWeight).toBe(0.8);
      expect(memory.importance).toBe(0.9);
    });
  });

  describe("createDivineMemory", () => {
    it("should create a non-erasable divine memory", () => {
      const memory = createDivineMemory("citizen-1", "Divine encounter", 30, 0.7);

      expect(memory.type).toBe("divine_interaction");
      expect(memory.isDivine).toBe(true);
      expect(memory.importance).toBe(1); // Max importance
      expect(memory.decayRate).toBe(0); // Never decays
      expect(memory.emotionalWeight).toBe(0.7);
    });
  });

  describe("processMemoryDecay", () => {
    it("should decay short-term memories", () => {
      const memories: CitizenMemory[] = [
        createMemory("c1", "Old thought", 0, { importance: 0.9 }),
      ];

      // Only 2 ticks = 0.2 decay, so 0.9 - 0.2 = 0.7 (still above 0.1 threshold)
      const processed = processMemoryDecay(memories, 2);

      // Importance should have decreased
      expect(processed.length).toBe(1);
      expect(processed[0].importance).toBeLessThan(0.9);
    });

    it("should NEVER decay divine memories", () => {
      const divine = createDivineMemory("c1", "Divine word", 0, 0.8);
      const memories: CitizenMemory[] = [divine];

      const processed = processMemoryDecay(memories, 1000);

      // Divine memory should be unchanged
      expect(processed[0].importance).toBe(1);
      expect(processed[0].isDivine).toBe(true);
    });

    it("should remove memories that decay below threshold", () => {
      const memories: CitizenMemory[] = [
        createMemory("c1", "Very old", 0, { importance: 0.15 }),
      ];

      const processed = processMemoryDecay(memories, 100);

      // Memory should be removed as importance decayed below 0.1
      expect(processed.length).toBe(0);
    });

    it("should always keep divine memories regardless of time", () => {
      const divine = createDivineMemory("c1", "Ancient divine memory", 0, -0.5);
      const memories: CitizenMemory[] = [divine];

      const processed = processMemoryDecay(memories, 10000);

      expect(processed.length).toBe(1);
      expect(processed[0].isDivine).toBe(true);
    });
  });

  describe("shouldConvertToLongTerm", () => {
    it("should convert high importance memories", () => {
      const memory = createMemory("c1", "Important", 10, { importance: 0.7 });
      expect(shouldConvertToLongTerm(memory)).toBe(true);
    });

    it("should convert highly emotional memories", () => {
      const memory = createMemory("c1", "Emotional", 10, {
        importance: 0.4,
        emotionalWeight: 0.8,
      });
      expect(shouldConvertToLongTerm(memory)).toBe(true);
    });

    it("should not convert already long-term memories", () => {
      const memory = createMemory("c1", "Already long", 10, { type: "long_term" });
      expect(shouldConvertToLongTerm(memory)).toBe(false);
    });

    it("should not convert low importance/emotion memories", () => {
      const memory = createMemory("c1", "Mundane", 10, {
        importance: 0.3,
        emotionalWeight: 0.2,
      });
      expect(shouldConvertToLongTerm(memory)).toBe(false);
    });
  });

  describe("convertToLongTerm", () => {
    it("should change type and decay rate", () => {
      const shortTerm = createMemory("c1", "Convert me", 10);
      const longTerm = convertToLongTerm(shortTerm);

      expect(longTerm.type).toBe("long_term");
      expect(longTerm.decayRate).toBeLessThan(shortTerm.decayRate);
      expect(longTerm.content).toBe(shortTerm.content); // Content preserved
    });
  });

  describe("pruneMemories", () => {
    it("should always keep divine memories", () => {
      const memories: CitizenMemory[] = [];

      // Add many regular memories
      for (let i = 0; i < 100; i++) {
        memories.push(createMemory("c1", `Memory ${i}`, i, { importance: 0.5 }));
      }

      // Add divine memories
      memories.push(createDivineMemory("c1", "Divine 1", 50, 0.5));
      memories.push(createDivineMemory("c1", "Divine 2", 60, 0.5));

      const pruned = pruneMemories(memories);

      const divineCount = pruned.filter((m) => m.isDivine).length;
      expect(divineCount).toBe(2);
    });

    it("should keep most important memories", () => {
      const memories: CitizenMemory[] = [
        createMemory("c1", "Low importance", 10, { importance: 0.2, type: "long_term" }),
        createMemory("c1", "High importance", 20, { importance: 0.9, type: "long_term" }),
        createMemory("c1", "Medium importance", 30, { importance: 0.5, type: "long_term" }),
      ];

      const pruned = pruneMemories(memories);

      // High importance should be first after sorting
      expect(pruned.some((m) => m.content === "High importance")).toBe(true);
    });
  });

  describe("extractMemoryPatterns", () => {
    it("should detect positive divine interaction pattern", () => {
      const memories: CitizenMemory[] = [
        createDivineMemory("c1", "Good divine experience", 10, 0.8),
        createDivineMemory("c1", "Another positive encounter", 20, 0.6),
      ];

      const patterns = extractMemoryPatterns(memories);

      expect(patterns.some((p) => p.toLowerCase().includes("positive"))).toBe(true);
      expect(patterns.some((p) => p.includes("divine interaction"))).toBe(true);
    });

    it("should detect negative life experiences", () => {
      const memories: CitizenMemory[] = [
        createMemory("c1", "Bad day", 10, { emotionalWeight: -0.8 }),
        createMemory("c1", "Terrible event", 20, { emotionalWeight: -0.7 }),
        createMemory("c1", "Another bad thing", 30, { emotionalWeight: -0.6 }),
      ];

      const patterns = extractMemoryPatterns(memories);

      expect(patterns.some((p) => p.toLowerCase().includes("hardship"))).toBe(true);
    });
  });
});
