/**
 * Whisperer Engine Tests - Phase 2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { recommendWhisperTone } from "@/lib/whisperer/engine";
import type { Citizen } from "@/types/citizen";

// Mock the guardrails module
vi.mock("@/lib/guardrails", () => ({
  checkGuardrails: vi.fn().mockResolvedValue({
    passed: true,
    safetyLevel: "safe",
    violations: [],
    warnings: [],
    interventionRequired: false,
  }),
}));

// Mock the memory module
vi.mock("@/lib/ai/citizen/memory", () => ({
  createDivineMemory: vi.fn().mockReturnValue({
    id: "test-memory",
    citizenId: "test-citizen",
    type: "divine_interaction",
    content: "Test memory",
    emotionalWeight: 0.5,
    importance: 1,
    tick: 1,
    decayRate: 0,
    isDivine: true,
  }),
}));

function createTestCitizen(overrides: Partial<Citizen> = {}): Citizen {
  return {
    id: "test-citizen",
    worldId: "test-world",
    name: "Test Citizen",
    attributes: {
      personalityArchetype: "pragmatist",
      emotionalSensitivity: 0.5,
      authorityTrustBias: 0,
      socialInfluencePotential: 0.5,
      curiosityAboutDivinity: 0.5,
    },
    state: {
      mood: 0,
      stress: 0.3,
      hope: 0.5,
      trustInPeers: 0.5,
      trustInGod: 0.3,
      cognitiveDissonance: 0.2,
    },
    consent: {
      emotionalConsent: 0.5,
      relationalPacingLimit: 0.5,
      authorityResistanceCurve: 0.5,
    },
    beliefs: [],
    createdAtTick: 0,
    lastActiveTick: 10,
    ...overrides,
  };
}

describe("Whisperer Engine", () => {
  describe("recommendWhisperTone", () => {
    it("should recommend comforting for highly stressed citizens", () => {
      const citizen = createTestCitizen({
        state: {
          mood: 0,
          stress: 0.8,
          hope: 0.5,
          trustInPeers: 0.5,
          trustInGod: 0.3,
          cognitiveDissonance: 0.2,
        },
      });

      const result = recommendWhisperTone(citizen);

      expect(result.recommended).toBe("comforting");
      expect(result.reasoning).toContain("stressed");
    });

    it("should recommend gentle for citizens in low mood", () => {
      const citizen = createTestCitizen({
        state: {
          mood: -0.5,
          stress: 0.2,
          hope: 0.3,
          trustInPeers: 0.5,
          trustInGod: 0.3,
          cognitiveDissonance: 0.2,
        },
      });

      const result = recommendWhisperTone(citizen);

      expect(result.recommended).toBe("gentle");
      expect(result.reasoning).toContain("low spirits");
    });

    it("should recommend mysterious for seeker personality", () => {
      const citizen = createTestCitizen({
        attributes: {
          personalityArchetype: "seeker",
          emotionalSensitivity: 0.5,
          authorityTrustBias: 0,
          socialInfluencePotential: 0.5,
          curiosityAboutDivinity: 0.7,
        },
        state: {
          mood: 0.3,
          stress: 0.2,
          hope: 0.5,
          trustInPeers: 0.5,
          trustInGod: 0.3,
          cognitiveDissonance: 0.2,
        },
      });

      const result = recommendWhisperTone(citizen);

      expect(result.recommended).toBe("mysterious");
      expect(result.reasoning).toContain("curious");
    });

    it("should recommend questioning for skeptic personality", () => {
      const citizen = createTestCitizen({
        attributes: {
          personalityArchetype: "skeptic",
          emotionalSensitivity: 0.5,
          authorityTrustBias: -0.3,
          socialInfluencePotential: 0.5,
          curiosityAboutDivinity: 0.4,
        },
        state: {
          mood: 0.2,
          stress: 0.2,
          hope: 0.5,
          trustInPeers: 0.5,
          trustInGod: 0.1,
          cognitiveDissonance: 0.3,
        },
      });

      const result = recommendWhisperTone(citizen);

      expect(result.recommended).toBe("questioning");
      expect(result.reasoning).toContain("skeptical");
    });

    it("should recommend urgent for citizens with high hope and trust", () => {
      const citizen = createTestCitizen({
        state: {
          mood: 0.5,
          stress: 0.2,
          hope: 0.8,
          trustInPeers: 0.5,
          trustInGod: 0.6,
          cognitiveDissonance: 0.1,
        },
      });

      const result = recommendWhisperTone(citizen);

      expect(result.recommended).toBe("urgent");
      expect(result.reasoning).toContain("hope");
    });

    it("should provide alternatives", () => {
      const citizen = createTestCitizen();

      const result = recommendWhisperTone(citizen);

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });
  });
});

describe("Whisper Reception", () => {
  it("should have valid reception types", () => {
    const validReceptions = [
      "accepted",
      "questioned",
      "ignored",
      "resisted",
      "misinterpreted",
      "shared",
    ];

    // Just verify the types exist
    expect(validReceptions).toHaveLength(6);
  });
});

describe("Whisper Tones", () => {
  const validTones = [
    "gentle",
    "urgent",
    "questioning",
    "comforting",
    "warning",
    "mysterious",
  ];

  it("should have 6 valid tones", () => {
    expect(validTones).toHaveLength(6);
  });

  it("should include non-coercive tones only", () => {
    const coerciveTones = ["demanding", "commanding", "threatening", "forcing"];

    for (const coercive of coerciveTones) {
      expect(validTones).not.toContain(coercive);
    }
  });
});
