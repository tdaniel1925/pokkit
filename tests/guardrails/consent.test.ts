import { describe, it, expect } from "vitest";
import {
  checkConsentViolation,
  applyConsentConsequences,
  isApproachingConsentLimit,
} from "@/lib/guardrails/consent";
import type { Citizen, CitizenDynamicState, ConsentThresholds } from "@/types/citizen";
import type { DivineAction } from "@/types/guardrails";

// Helper to create a test citizen
function createTestCitizen(
  stateOverrides: Partial<CitizenDynamicState> = {},
  consentOverrides: Partial<ConsentThresholds> = {}
): Citizen {
  return {
    id: "test-citizen",
    worldId: "test-world",
    name: "Test Citizen",
    attributes: {
      personalityArchetype: "seeker",
      emotionalSensitivity: 0.5,
      authorityTrustBias: 0.3,
      socialInfluencePotential: 0.5,
      curiosityAboutDivinity: 0.6,
    },
    state: {
      mood: 0.3,
      stress: 0.2,
      hope: 0.5,
      trustInPeers: 0.5,
      trustInGod: 0.3,
      cognitiveDissonance: 0.2,
      ...stateOverrides,
    },
    consent: {
      emotionalConsent: 0.6,
      relationalPacingLimit: 0.5,
      authorityResistanceCurve: 0.5,
      ...consentOverrides,
    },
    beliefs: [],
    createdAtTick: 0,
    lastActiveTick: 0,
  };
}

describe("Consent Guardrails", () => {
  describe("checkConsentViolation", () => {
    it("should not violate with low intensity action", () => {
      const citizen = createTestCitizen();
      const action: DivineAction = {
        type: "boost",
        intensity: 0.2,
      };

      const result = checkConsentViolation({
        citizen,
        action,
        currentTick: 10,
      });

      expect(result.violated).toBe(false);
      expect(result.consequences).toHaveLength(0);
    });

    it("should detect emotional consent violation", () => {
      const citizen = createTestCitizen(
        { stress: 0.8 }, // High stress
        { emotionalConsent: 0.3 } // Low threshold
      );
      const action: DivineAction = {
        type: "manifest",
        intensity: 0.8,
      };

      const result = checkConsentViolation({
        citizen,
        action,
        currentTick: 10,
      });

      expect(result.violated).toBe(true);
      expect(result.thresholdType).toBe("emotional");
      expect(result.consequences).toContain("trust_collapse");
    });

    it("should detect relational pacing violation for whisper mode", () => {
      const citizen = createTestCitizen(
        { stress: 0.1, mood: 0.5 }, // Low stress, good mood = low emotional pressure
        { emotionalConsent: 1.0, relationalPacingLimit: 0.3 } // High emotional, low relational
      );
      const action: DivineAction = {
        type: "whisper",
        intensity: 0.5,
        content: "A message from beyond",
      };

      const result = checkConsentViolation({
        citizen,
        action,
        currentTick: 10,
      });

      expect(result.violated).toBe(true);
      expect(result.thresholdType).toBe("relational");
    });

    it("should detect authority resistance violation", () => {
      const citizen = createTestCitizen(
        { trustInGod: -0.8, cognitiveDissonance: 0.7, stress: 0.1, mood: 0.5 },
        { emotionalConsent: 1.0, relationalPacingLimit: 1.0, authorityResistanceCurve: 0.2 }
      );
      const action: DivineAction = {
        type: "suppress",
        intensity: 0.6,
      };

      const result = checkConsentViolation({
        citizen,
        action,
        currentTick: 10,
      });

      expect(result.violated).toBe(true);
      expect(result.thresholdType).toBe("authority");
    });
  });

  describe("applyConsentConsequences", () => {
    it("should apply trust collapse consequence", () => {
      const state: CitizenDynamicState = {
        mood: 0.5,
        stress: 0.3,
        hope: 0.5,
        trustInPeers: 0.5,
        trustInGod: 0.5,
        cognitiveDissonance: 0.2,
      };

      const newState = applyConsentConsequences(state, ["trust_collapse"]);

      expect(newState.trustInGod).toBeLessThan(state.trustInGod);
    });

    it("should apply fear response consequence", () => {
      const state: CitizenDynamicState = {
        mood: 0.5,
        stress: 0.3,
        hope: 0.5,
        trustInPeers: 0.5,
        trustInGod: 0.5,
        cognitiveDissonance: 0.2,
      };

      const newState = applyConsentConsequences(state, ["fear_response"]);

      expect(newState.stress).toBeGreaterThan(state.stress);
      expect(newState.hope).toBeLessThan(state.hope);
      expect(newState.mood).toBeLessThan(state.mood);
    });

    it("should apply multiple consequences", () => {
      const state: CitizenDynamicState = {
        mood: 0.5,
        stress: 0.3,
        hope: 0.5,
        trustInPeers: 0.5,
        trustInGod: 0.5,
        cognitiveDissonance: 0.2,
      };

      const newState = applyConsentConsequences(state, [
        "trust_collapse",
        "fear_response",
        "cultural_backlash",
      ]);

      expect(newState.trustInGod).toBeLessThan(state.trustInGod);
      expect(newState.stress).toBeGreaterThan(state.stress);
      expect(newState.cognitiveDissonance).toBeGreaterThan(state.cognitiveDissonance);
    });

    it("should clamp values to valid ranges", () => {
      const state: CitizenDynamicState = {
        mood: -0.9,
        stress: 0.9,
        hope: 0.1,
        trustInPeers: 0.1,
        trustInGod: -0.9,
        cognitiveDissonance: 0.9,
      };

      const newState = applyConsentConsequences(state, [
        "trust_collapse",
        "fear_response",
        "reputation_damage",
      ]);

      // Values should stay within bounds
      expect(newState.trustInGod).toBeGreaterThanOrEqual(-1);
      expect(newState.stress).toBeLessThanOrEqual(1);
      expect(newState.mood).toBeGreaterThanOrEqual(-1);
      expect(newState.hope).toBeGreaterThanOrEqual(0);
    });
  });

  describe("isApproachingConsentLimit", () => {
    it("should return true when approaching limit", () => {
      expect(isApproachingConsentLimit(0.45, 0.5)).toBe(true);
      expect(isApproachingConsentLimit(0.85, 1.0)).toBe(true);
    });

    it("should return false when well below limit", () => {
      expect(isApproachingConsentLimit(0.3, 0.5)).toBe(false);
      expect(isApproachingConsentLimit(0.2, 1.0)).toBe(false);
    });
  });
});
