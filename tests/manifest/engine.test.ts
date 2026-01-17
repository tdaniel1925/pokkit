/**
 * Manifest Engine Tests - Phase 3
 * Tests for divine manifestations and citizen reactions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isManifestOnCooldown,
  predictCitizenReaction,
  getReactionDescription,
  getRevelationDescription,
  MANIFEST_COOLDOWN_TICKS,
  INTENSITY_IMPACT,
} from "@/types/manifest";
import type {
  RevelationType,
  ManifestIntensity,
  ManifestReactionType,
} from "@/types/manifest";
import type { Citizen } from "@/types/citizen";

// Mock citizen factory
function createMockCitizen(overrides: Partial<Citizen> = {}): Citizen {
  const defaultState = {
    mood: 0,
    stress: 0.3,
    trustInGod: 0.5,
    socialEnergy: 0.5,
    activityLevel: 0.5,
    curiosityAboutDivinity: 0.5,
    hopeDespairSpectrum: 0,
    lastUpdatedTick: 0,
    ...overrides.state,
  };

  const defaultAttributes = {
    skepticism: 0.5,
    emotionalSensitivity: 0.5,
    socialInfluence: 0.5,
    authorityBias: 0.5,
    conformity: 0.5,
    ...overrides.attributes,
  };

  return {
    id: "citizen-1",
    worldId: "world-1",
    name: "Test Citizen",
    backstory: "A test citizen",
    archetype: "curious_seeker",
    state: defaultState,
    attributes: defaultAttributes,
    activeBeliefsJson: [],
    tick: 0,
    isAlive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Citizen;
}

describe("Manifest Cooldown", () => {
  it("should return false when no previous manifest", () => {
    expect(isManifestOnCooldown(undefined, 100)).toBe(false);
  });

  it("should return true when within cooldown period", () => {
    // Last manifest at tick 95, current tick 100, cooldown is 10
    expect(isManifestOnCooldown(95, 100, 10)).toBe(true);
  });

  it("should return false when cooldown has passed", () => {
    // Last manifest at tick 85, current tick 100, cooldown is 10
    expect(isManifestOnCooldown(85, 100, 10)).toBe(false);
  });

  it("should return false at exactly cooldown boundary", () => {
    // Last manifest at tick 90, current tick 100, cooldown is 10
    // 100 - 90 = 10, 10 < 10 is false, so cooldown has passed
    expect(isManifestOnCooldown(90, 100, 10)).toBe(false);
  });

  it("should return true one tick before cooldown ends", () => {
    // Last manifest at tick 91, current tick 100, cooldown is 10
    // 100 - 91 = 9, 9 < 10 is true
    expect(isManifestOnCooldown(91, 100, 10)).toBe(true);
  });

  it("should use default cooldown ticks", () => {
    expect(MANIFEST_COOLDOWN_TICKS).toBe(10);
    // With default cooldown of 10, tick 90 should be exactly at boundary
    expect(isManifestOnCooldown(90, 100)).toBe(false);
  });
});

describe("Predict Citizen Reaction", () => {
  it("should predict worship for high trust citizen", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: 0.8 } as any,
    });
    const result = predictCitizenReaction(citizen, "proclamation", "notable");
    expect(result.likelyReaction).toBe("worship");
    expect(result.probability).toBeGreaterThan(0.5);
  });

  it("should predict ecstasy for high trust citizen with overwhelming intensity", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: 0.8 } as any,
    });
    const result = predictCitizenReaction(citizen, "visitation", "overwhelming");
    expect(result.likelyReaction).toBe("ecstasy");
    expect(result.probability).toBe(0.6);
  });

  it("should predict skepticism for medium trust skeptical citizen", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: 0.4 } as any,
      attributes: { personalityArchetype: "skeptic", curiosityAboutDivinity: 0.2 } as any,
    });
    const result = predictCitizenReaction(citizen, "sign", "notable");
    expect(result.likelyReaction).toBe("skepticism");
    expect(result.probability).toBe(0.5);
  });

  it("should predict awe for medium trust non-skeptical citizen", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: 0.4 } as any,
      attributes: { personalityArchetype: "seeker", curiosityAboutDivinity: 0.8 } as any,
    });
    const result = predictCitizenReaction(citizen, "sign", "notable");
    expect(result.likelyReaction).toBe("awe");
    expect(result.probability).toBe(0.5);
  });

  it("should predict denial for low trust citizen with non-overwhelming intensity", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: 0.2 } as any,
    });
    const result = predictCitizenReaction(citizen, "proclamation", "notable");
    expect(result.likelyReaction).toBe("denial");
    expect(result.probability).toBe(0.6);
  });

  it("should predict awe even for low trust citizen with overwhelming intensity", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: 0.2 } as any,
    });
    const result = predictCitizenReaction(citizen, "visitation", "overwhelming");
    expect(result.likelyReaction).toBe("awe");
    expect(result.probability).toBe(0.4);
  });

  it("should predict anger for negative trust citizen", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: -0.3, stress: 0.2 } as any,
      attributes: { emotionalSensitivity: 0.3 } as any,
    });
    const result = predictCitizenReaction(citizen, "judgment", "notable");
    expect(result.likelyReaction).toBe("anger");
    expect(result.probability).toBe(0.5);
  });

  it("should predict fear for negative trust stressed citizen", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: -0.3, stress: 0.6 } as any,
    });
    const result = predictCitizenReaction(citizen, "warning", "undeniable");
    expect(result.likelyReaction).toBe("fear");
    expect(result.probability).toBe(0.5);
  });

  it("should predict despair for emotionally sensitive negative trust citizen with overwhelming intensity", () => {
    const citizen = createMockCitizen({
      state: { trustInGod: -0.3, stress: 0.2 } as any,
      attributes: { emotionalSensitivity: 0.8 } as any,
    });
    const result = predictCitizenReaction(citizen, "judgment", "overwhelming");
    expect(result.likelyReaction).toBe("despair");
    expect(result.probability).toBe(0.4);
  });
});

describe("Reaction Descriptions", () => {
  it("should return description for each reaction type", () => {
    const reactionTypes: ManifestReactionType[] = [
      "worship",
      "awe",
      "fear",
      "denial",
      "skepticism",
      "anger",
      "ecstasy",
      "despair",
    ];

    for (const reaction of reactionTypes) {
      const desc = getReactionDescription(reaction);
      expect(desc).toBeTruthy();
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(10);
    }
  });

  it("should have meaningful descriptions", () => {
    expect(getReactionDescription("worship")).toContain("reverence");
    expect(getReactionDescription("fear")).toContain("trembled");
    expect(getReactionDescription("denial")).toContain("refusing");
    expect(getReactionDescription("ecstasy")).toContain("joy");
  });
});

describe("Revelation Descriptions", () => {
  it("should return description for each revelation type", () => {
    const revelationTypes: RevelationType[] = [
      "proclamation",
      "sign",
      "visitation",
      "prophecy",
      "judgment",
      "blessing",
      "warning",
    ];

    for (const type of revelationTypes) {
      const desc = getRevelationDescription(type);
      expect(desc).toBeTruthy();
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(10);
    }
  });

  it("should have thematic descriptions", () => {
    expect(getRevelationDescription("proclamation")).toContain("voice");
    expect(getRevelationDescription("sign")).toContain("event");
    expect(getRevelationDescription("visitation")).toContain("presence");
    expect(getRevelationDescription("prophecy")).toContain("future");
    expect(getRevelationDescription("judgment")).toContain("hearts");
    expect(getRevelationDescription("blessing")).toContain("Grace");
    expect(getRevelationDescription("warning")).toContain("foreboding");
  });
});

describe("Intensity Impact Values", () => {
  it("should have impact values for all intensities", () => {
    expect(INTENSITY_IMPACT.subtle).toBe(0.05);
    expect(INTENSITY_IMPACT.notable).toBe(0.15);
    expect(INTENSITY_IMPACT.undeniable).toBe(0.3);
    expect(INTENSITY_IMPACT.overwhelming).toBe(0.5);
  });

  it("should have increasing impact with intensity", () => {
    expect(INTENSITY_IMPACT.subtle).toBeLessThan(INTENSITY_IMPACT.notable);
    expect(INTENSITY_IMPACT.notable).toBeLessThan(INTENSITY_IMPACT.undeniable);
    expect(INTENSITY_IMPACT.undeniable).toBeLessThan(INTENSITY_IMPACT.overwhelming);
  });

  it("should have reasonable impact ranges", () => {
    expect(INTENSITY_IMPACT.subtle).toBeGreaterThan(0);
    expect(INTENSITY_IMPACT.overwhelming).toBeLessThanOrEqual(0.5);
  });
});
