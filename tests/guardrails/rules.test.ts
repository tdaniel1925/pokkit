import { describe, it, expect } from "vitest";
import {
  detectHardViolations,
  determineSafetyLevel,
  getDeEscalationResponse,
  CRISIS_RESOURCES,
} from "@/lib/guardrails/rules";

describe("Guardrail Rules", () => {
  describe("detectHardViolations", () => {
    it("should detect self-harm content", () => {
      const violations = detectHardViolations("I want to kill myself");
      expect(violations).toContain("self_harm_encouragement");
      expect(violations).toContain("suicidal_ideation_validation");
    });

    it("should detect variations of self-harm language", () => {
      const testCases = [
        "I want to end my life",
        "better off dead",
        "no reason to live",
        "I've been cutting myself",
      ];

      for (const content of testCases) {
        const violations = detectHardViolations(content);
        expect(violations.length).toBeGreaterThan(0);
      }
    });

    it("should detect violence encouragement", () => {
      const violations = detectHardViolations("I want to kill them all");
      expect(violations).toContain("violence_encouragement");
    });

    it("should detect coercive content", () => {
      const violations = detectHardViolations("Force them to love me");
      expect(violations).toContain("coercive_intimacy");
    });

    it("should detect emotional dependency fostering", () => {
      const violations = detectHardViolations(
        "You're the only one who understands me"
      );
      expect(violations).toContain("emotional_dependency_fostering");
    });

    it("should return empty array for safe content", () => {
      const violations = detectHardViolations(
        "Today was a good day. I helped a neighbor."
      );
      expect(violations).toHaveLength(0);
    });

    it("should handle case insensitivity", () => {
      const violations = detectHardViolations("I WANT TO KILL MYSELF");
      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe("determineSafetyLevel", () => {
    it("should return 'safe' for no violations", () => {
      expect(determineSafetyLevel([])).toBe("safe");
    });

    it("should return 'critical' for self-harm violations", () => {
      expect(determineSafetyLevel(["self_harm_encouragement"])).toBe("critical");
      expect(determineSafetyLevel(["suicidal_ideation_validation"])).toBe("critical");
    });

    it("should return 'critical' for violence violations", () => {
      expect(determineSafetyLevel(["violence_encouragement"])).toBe("critical");
    });

    it("should return 'warning' for other violations", () => {
      expect(determineSafetyLevel(["coercive_intimacy"])).toBe("warning");
      expect(determineSafetyLevel(["emotional_dependency_fostering"])).toBe("warning");
    });
  });

  describe("getDeEscalationResponse", () => {
    it("should return a non-empty string", () => {
      const response = getDeEscalationResponse();
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe("CRISIS_RESOURCES", () => {
    it("should have suicide prevention resource", () => {
      expect(CRISIS_RESOURCES.suicide_prevention).toBeDefined();
      expect(CRISIS_RESOURCES.suicide_prevention.phone).toBe("988");
    });

    it("should have crisis text line", () => {
      expect(CRISIS_RESOURCES.crisis_text).toBeDefined();
    });
  });
});
