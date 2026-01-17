import { describe, it, expect } from "vitest";
import {
  generateRandomAttributes,
  generateCitizenName,
  buildPersonalityPrompt,
  ARCHETYPE_DESCRIPTIONS,
} from "@/lib/ai/citizen/personality";
import { PersonalityArchetypes } from "@/types/citizen";

describe("Citizen Personality System", () => {
  describe("generateRandomAttributes", () => {
    it("should generate valid attributes", () => {
      const attributes = generateRandomAttributes();

      expect(PersonalityArchetypes).toContain(attributes.personalityArchetype);
      expect(attributes.emotionalSensitivity).toBeGreaterThanOrEqual(0);
      expect(attributes.emotionalSensitivity).toBeLessThanOrEqual(1);
      expect(attributes.authorityTrustBias).toBeGreaterThanOrEqual(-1);
      expect(attributes.authorityTrustBias).toBeLessThanOrEqual(1);
      expect(attributes.socialInfluencePotential).toBeGreaterThanOrEqual(0);
      expect(attributes.socialInfluencePotential).toBeLessThanOrEqual(1);
      expect(attributes.curiosityAboutDivinity).toBeGreaterThanOrEqual(0);
      expect(attributes.curiosityAboutDivinity).toBeLessThanOrEqual(1);
    });

    it("should generate different attributes on multiple calls", () => {
      const results = new Set<string>();

      // Generate multiple times and check for variety
      for (let i = 0; i < 20; i++) {
        const attrs = generateRandomAttributes();
        results.add(attrs.personalityArchetype);
      }

      // Should have generated multiple different archetypes
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe("generateCitizenName", () => {
    it("should generate a valid name", () => {
      const name = generateCitizenName();

      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      expect(name).toContain(" "); // Should have first and last name
    });

    it("should generate different names", () => {
      const names = new Set<string>();

      for (let i = 0; i < 50; i++) {
        names.add(generateCitizenName());
      }

      // Should have variety in names
      expect(names.size).toBeGreaterThan(10);
    });
  });

  describe("buildPersonalityPrompt", () => {
    it("should include archetype description", () => {
      const attributes = {
        personalityArchetype: "skeptic" as const,
        emotionalSensitivity: 0.5,
        authorityTrustBias: -0.5,
        socialInfluencePotential: 0.5,
        curiosityAboutDivinity: 0.3,
      };

      const prompt = buildPersonalityPrompt(attributes);

      expect(prompt).toContain("skeptic");
      expect(prompt.toLowerCase()).toContain("question");
    });

    it("should include emotional sensitivity modifiers", () => {
      const highEmotional = {
        personalityArchetype: "believer" as const,
        emotionalSensitivity: 0.9,
        authorityTrustBias: 0.5,
        socialInfluencePotential: 0.5,
        curiosityAboutDivinity: 0.5,
      };

      const lowEmotional = {
        ...highEmotional,
        emotionalSensitivity: 0.2,
      };

      const highPrompt = buildPersonalityPrompt(highEmotional);
      const lowPrompt = buildPersonalityPrompt(lowEmotional);

      expect(highPrompt.toLowerCase()).toContain("feel emotions deeply");
      expect(lowPrompt.toLowerCase()).toContain("reserved");
    });

    it("should include authority trust modifiers", () => {
      const trusting = {
        personalityArchetype: "conformist" as const,
        emotionalSensitivity: 0.5,
        authorityTrustBias: 0.7,
        socialInfluencePotential: 0.5,
        curiosityAboutDivinity: 0.5,
      };

      const distrusting = {
        ...trusting,
        authorityTrustBias: -0.7,
      };

      const trustingPrompt = buildPersonalityPrompt(trusting);
      const distrustingPrompt = buildPersonalityPrompt(distrusting);

      expect(trustingPrompt.toLowerCase()).toContain("trust authority");
      expect(distrustingPrompt.toLowerCase()).toContain("skeptical of authority");
    });
  });

  describe("ARCHETYPE_DESCRIPTIONS", () => {
    it("should have descriptions for all archetypes", () => {
      for (const archetype of PersonalityArchetypes) {
        expect(ARCHETYPE_DESCRIPTIONS[archetype]).toBeDefined();
        expect(ARCHETYPE_DESCRIPTIONS[archetype].length).toBeGreaterThan(0);
      }
    });
  });
});
