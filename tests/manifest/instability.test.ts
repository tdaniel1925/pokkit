/**
 * Manifest Instability Tests - Phase 3
 * Tests for world instability calculations and societal effects
 */

import { describe, it, expect } from "vitest";
import {
  calculateInstabilityTrend,
  getSocietalEffects,
  generateManifestMemory,
} from "@/lib/manifest/engine";
import type { ManifestReactionType, RevelationType } from "@/types/manifest";

describe("Calculate Instability Trend", () => {
  it("should return critical when instability >= 0.8", () => {
    expect(calculateInstabilityTrend(0.8, 0.7)).toBe("critical");
    expect(calculateInstabilityTrend(0.9, 0.85)).toBe("critical");
    expect(calculateInstabilityTrend(1.0, 0.95)).toBe("critical");
  });

  it("should return rising when increasing by more than 0.05", () => {
    expect(calculateInstabilityTrend(0.5, 0.4)).toBe("rising");
    expect(calculateInstabilityTrend(0.7, 0.6)).toBe("rising");
    expect(calculateInstabilityTrend(0.3, 0.2)).toBe("rising");
  });

  it("should return falling when decreasing by more than 0.05", () => {
    expect(calculateInstabilityTrend(0.3, 0.4)).toBe("falling");
    expect(calculateInstabilityTrend(0.5, 0.6)).toBe("falling");
    expect(calculateInstabilityTrend(0.2, 0.3)).toBe("falling");
  });

  it("should return stable when change is within 0.05", () => {
    expect(calculateInstabilityTrend(0.5, 0.5)).toBe("stable");
    expect(calculateInstabilityTrend(0.52, 0.5)).toBe("stable");
    expect(calculateInstabilityTrend(0.48, 0.5)).toBe("stable");
    expect(calculateInstabilityTrend(0.55, 0.5)).toBe("stable");
    expect(calculateInstabilityTrend(0.45, 0.5)).toBe("stable");
  });

  it("should prioritize critical over rising", () => {
    // Even if rising, if >= 0.8 it should be critical
    expect(calculateInstabilityTrend(0.85, 0.7)).toBe("critical");
  });
});

describe("Get Societal Effects", () => {
  it("should return empty array for low instability", () => {
    const effects = getSocietalEffects(0.2, 100);
    expect(effects).toHaveLength(0);
  });

  it("should return polarization at 0.3 instability", () => {
    const effects = getSocietalEffects(0.3, 100);
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe("polarization");
    expect(effects[0].triggeredAtTick).toBe(100);
    expect(effects[0].strength).toBeCloseTo(0.15); // 0.3 * 0.5
  });

  it("should return multiple effects at 0.5 instability", () => {
    const effects = getSocietalEffects(0.5, 100);
    expect(effects.length).toBeGreaterThanOrEqual(3);

    const types = effects.map((e) => e.type);
    expect(types).toContain("polarization");
    expect(types).toContain("religious_fervor");
    expect(types).toContain("fear_spreading");
  });

  it("should include prophet emergence at 0.7 instability", () => {
    const effects = getSocietalEffects(0.7, 100);
    const types = effects.map((e) => e.type);
    expect(types).toContain("prophet_emergence");
  });

  it("should include schism and social breakdown at 0.9 instability", () => {
    const effects = getSocietalEffects(0.9, 100);
    const types = effects.map((e) => e.type);
    expect(types).toContain("schism");
    expect(types).toContain("social_breakdown");
  });

  it("should have all effects at maximum instability", () => {
    const effects = getSocietalEffects(1.0, 100);
    expect(effects.length).toBeGreaterThanOrEqual(6);

    // All effects should have the tick recorded
    for (const effect of effects) {
      expect(effect.triggeredAtTick).toBe(100);
      expect(effect.strength).toBeGreaterThan(0);
      expect(effect.description).toBeTruthy();
    }
  });

  it("should scale effect strength with instability", () => {
    const effects05 = getSocietalEffects(0.5, 100);
    const effects09 = getSocietalEffects(0.9, 100);

    const polarization05 = effects05.find((e) => e.type === "polarization");
    const polarization09 = effects09.find((e) => e.type === "polarization");

    expect(polarization09!.strength).toBeGreaterThan(polarization05!.strength);
  });
});

describe("Generate Manifest Memory", () => {
  const testContent = "The divine speaks to all who will listen.";
  const longContent = "A".repeat(100);

  it("should generate memory for worship reaction", () => {
    const memory = generateManifestMemory("worship", "proclamation", testContent);
    expect(memory).toContain("proclamation");
    expect(memory).toContain("reverence");
    expect(memory).toContain("divine");
    expect(memory).toContain("faith");
  });

  it("should generate memory for awe reaction", () => {
    const memory = generateManifestMemory("awe", "sign", testContent);
    expect(memory).toContain("sign");
    expect(memory).toContain("extraordinary");
  });

  it("should generate memory for fear reaction", () => {
    const memory = generateManifestMemory("fear", "warning", testContent);
    expect(memory).toContain("warning");
    expect(memory).toContain("terrifying");
  });

  it("should generate memory for denial reaction", () => {
    const memory = generateManifestMemory("denial", "visitation", testContent);
    expect(memory).toContain("refuse");
    expect(memory).toContain("supernatural");
  });

  it("should generate memory for skepticism reaction", () => {
    const memory = generateManifestMemory("skepticism", "prophecy", testContent);
    expect(memory).toContain("skeptical");
    expect(memory).toContain("evidence");
  });

  it("should generate memory for anger reaction", () => {
    const memory = generateManifestMemory("anger", "judgment", testContent);
    expect(memory).toContain("resent");
    expect(memory).toContain("interference");
  });

  it("should generate memory for ecstasy reaction", () => {
    const memory = generateManifestMemory("ecstasy", "blessing", testContent);
    expect(memory).toContain("transcendence");
    expect(memory).toContain("Joy");
  });

  it("should generate memory for despair reaction", () => {
    const memory = generateManifestMemory("despair", "judgment", testContent);
    expect(memory).toContain("shattered");
    expect(memory).toContain("worldview");
  });

  it("should truncate long content with ellipsis", () => {
    const memory = generateManifestMemory("worship", "proclamation", longContent);
    expect(memory).toContain("...");
    // Should contain first 50 chars
    expect(memory).toContain("A".repeat(50));
  });

  it("should include short content fully", () => {
    const shortContent = "Brief message";
    const memory = generateManifestMemory("awe", "sign", shortContent);
    expect(memory).toContain(shortContent);
    expect(memory).not.toContain("...");
  });

  it("should generate unique memories for each reaction type", () => {
    const reactions: ManifestReactionType[] = [
      "worship",
      "awe",
      "fear",
      "denial",
      "skepticism",
      "anger",
      "ecstasy",
      "despair",
    ];

    const memories = reactions.map((r) =>
      generateManifestMemory(r, "proclamation", testContent)
    );

    // All memories should be unique
    const uniqueMemories = new Set(memories);
    expect(uniqueMemories.size).toBe(reactions.length);
  });
});
