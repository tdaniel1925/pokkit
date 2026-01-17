import { describe, it, expect } from "vitest";
import {
  createWorld,
  initializeWorld,
  getDefaultWorldConfig,
  validateWorldConfig,
  isPresenceModeAvailable,
  calculateWorldStability,
  getWorldSummary,
} from "@/lib/simulation/world";
import type { WorldState } from "@/types/world";
import type { Citizen, CitizenDynamicState } from "@/types/citizen";

// Helper to create test citizens
function createTestCitizens(count: number, stateOverride: Partial<CitizenDynamicState> = {}): Citizen[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `citizen-${i}`,
    worldId: "test-world",
    name: `Citizen ${i}`,
    attributes: {
      personalityArchetype: "seeker" as const,
      emotionalSensitivity: 0.5,
      authorityTrustBias: 0.3,
      socialInfluencePotential: 0.5,
      curiosityAboutDivinity: 0.5,
    },
    state: {
      mood: 0.3,
      stress: 0.2,
      hope: 0.5,
      trustInPeers: 0.5,
      trustInGod: 0.3,
      cognitiveDissonance: 0.2,
      ...stateOverride,
    },
    consent: {
      emotionalConsent: 0.6,
      relationalPacingLimit: 0.5,
      authorityResistanceCurve: 0.5,
    },
    beliefs: [],
    createdAtTick: 0,
    lastActiveTick: 0,
  }));
}

describe("World Management", () => {
  describe("createWorld", () => {
    it("should create a world with given config", () => {
      const config = getDefaultWorldConfig("Test World");
      const world = createWorld("user-1", config);

      expect(world.id).toBeDefined();
      expect(world.userId).toBe("user-1");
      expect(world.config.name).toBe("Test World");
      expect(world.tick).toBe(0);
      expect(world.status).toBe("active");
    });
  });

  describe("initializeWorld", () => {
    it("should generate population based on config", () => {
      const config = getDefaultWorldConfig("Genesis");
      config.populationSize = 10;
      const world = createWorld("user-1", config);

      const { citizens } = initializeWorld(world);

      expect(citizens.length).toBe(10);
      expect(citizens[0].worldId).toBe(world.id);
    });
  });

  describe("validateWorldConfig", () => {
    it("should accept valid config", () => {
      const config = getDefaultWorldConfig("Valid World");
      const result = validateWorldConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty name", () => {
      const result = validateWorldConfig({ name: "" });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("name"))).toBe(true);
    });

    it("should reject population outside bounds", () => {
      const tooSmall = validateWorldConfig({ name: "Test", populationSize: 2 });
      const tooLarge = validateWorldConfig({ name: "Test", populationSize: 5000 });

      expect(tooSmall.valid).toBe(false);
      expect(tooLarge.valid).toBe(false);
    });

    it("should reject invalid range values", () => {
      const result = validateWorldConfig({
        name: "Test",
        culturalEntropy: 1.5, // > 1
        beliefPlasticity: -0.5, // < 0
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });

  describe("isPresenceModeAvailable", () => {
    const mockWorld: WorldState = {
      id: "test",
      userId: "user",
      config: getDefaultWorldConfig("Test"),
      tick: 50,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should allow observer mode always", () => {
      const result = isPresenceModeAvailable("observer", mockWorld, 50);
      expect(result.available).toBe(true);
    });

    it("should allow influencer mode in Phase 1", () => {
      const result = isPresenceModeAvailable("influencer", mockWorld, 50);
      expect(result.available).toBe(true);
    });

    it("should indicate whisperer is Phase 2", () => {
      const result = isPresenceModeAvailable("whisperer", mockWorld, 50);
      expect(result.available).toBe(false);
      expect(result.reason).toContain("Phase 2");
    });

    it("should indicate manifest is Phase 3", () => {
      const result = isPresenceModeAvailable("manifest", mockWorld, 50);
      expect(result.available).toBe(false);
      expect(result.reason).toContain("Phase 3");
    });
  });

  describe("calculateWorldStability", () => {
    it("should return high stability for healthy population", () => {
      const citizens = createTestCitizens(10, {
        stress: 0.1,
        cognitiveDissonance: 0.1,
        trustInPeers: 0.8,
      });

      const stability = calculateWorldStability(citizens);

      expect(stability).toBeGreaterThan(0.7);
    });

    it("should return lower stability for stressed population", () => {
      const citizens = createTestCitizens(10, {
        stress: 0.9,
        cognitiveDissonance: 0.8,
        trustInPeers: 0.2,
      });

      const stability = calculateWorldStability(citizens);

      // Stability formula: 1 - stress*0.3 - dissonance*0.3 + trust*0.2
      // = 1 - 0.27 - 0.24 + 0.04 = 0.53
      expect(stability).toBeLessThan(0.6);
      expect(stability).toBeGreaterThan(0.4);
    });

    it("should return 1 for empty population", () => {
      expect(calculateWorldStability([])).toBe(1);
    });
  });

  describe("getWorldSummary", () => {
    const mockWorld: WorldState = {
      id: "test",
      userId: "user",
      config: getDefaultWorldConfig("Test"),
      tick: 100,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should report thriving for happy population", () => {
      const citizens = createTestCitizens(10, {
        mood: 0.7,
        hope: 0.8,
        stress: 0.1,
        cognitiveDissonance: 0.1,
        trustInPeers: 0.8,
      });

      const summary = getWorldSummary(mockWorld, citizens);

      expect(summary.populationHealth).toBe("thriving");
    });

    it("should report struggling/crisis for suffering population", () => {
      const citizens = createTestCitizens(10, {
        mood: -0.5,
        hope: 0.1,
        stress: 0.9,
        cognitiveDissonance: 0.8,
        trustInPeers: 0.1,
      });

      const summary = getWorldSummary(mockWorld, citizens);

      // With these values, stability is ~0.53, mood is negative, hope is low
      // This qualifies as "struggling" based on the thresholds
      expect(["struggling", "crisis"]).toContain(summary.populationHealth);
    });

    it("should calculate average statistics correctly", () => {
      const citizens = [
        ...createTestCitizens(5, { trustInGod: 0.8 }),
        ...createTestCitizens(5, { trustInGod: -0.2 }),
      ];

      const summary = getWorldSummary(mockWorld, citizens);

      // Average of 0.8 and -0.2 = 0.3
      expect(summary.avgTrustInGod).toBeCloseTo(0.3, 1);
    });
  });
});
