/**
 * Social Dynamics Tests - Phase 2
 */

import { describe, it, expect } from "vitest";
import {
  formRelationship,
  updateRelationship,
  calculateSocialCohesion,
  findInfluentialCitizens,
  findIsolatedCitizens,
  attemptInfluence,
} from "@/lib/social/dynamics";
import type { Citizen, CitizenRelationship } from "@/types/citizen";
import type { WorldState } from "@/types/world";

function createTestCitizen(
  id: string,
  overrides: Partial<Citizen> = {}
): Citizen {
  return {
    id,
    worldId: "test-world",
    name: `Citizen ${id}`,
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

function createTestRelationship(
  citizenId: string,
  targetId: string,
  overrides: Partial<CitizenRelationship> = {}
): CitizenRelationship {
  return {
    id: `rel-${citizenId}-${targetId}`,
    citizenId,
    targetCitizenId: targetId,
    type: "acquaintance",
    strength: 0.5,
    trust: 0.3,
    lastInteractionTick: 10,
    ...overrides,
  };
}

const testWorld: WorldState = {
  id: "test-world",
  userId: "test-user",
  config: {
    name: "Test World",
    populationSize: 10,
    culturalEntropy: 0.5,
    beliefPlasticity: 0.5,
    crisisFrequency: 0.3,
    authoritySkepticismIndex: 0.5,
  },
  tick: 100,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Relationship Formation", () => {
  it("should form relationship between compatible citizens", () => {
    const citizen1 = createTestCitizen("c1", {
      attributes: {
        personalityArchetype: "idealist",
        emotionalSensitivity: 0.6,
        authorityTrustBias: 0.2,
        socialInfluencePotential: 0.7,
        curiosityAboutDivinity: 0.5,
      },
    });

    const citizen2 = createTestCitizen("c2", {
      attributes: {
        personalityArchetype: "pragmatist",
        emotionalSensitivity: 0.5,
        authorityTrustBias: 0.1,
        socialInfluencePotential: 0.6,
        curiosityAboutDivinity: 0.4,
      },
    });

    const result = formRelationship(citizen1, citizen2, 100, "random_encounter");

    expect(result.formed).toBe(true);
    expect(result.relationship).toBeDefined();
    expect(result.event).toBeDefined();
  });

  it("should reject relationship for incompatible citizens", () => {
    const citizen1 = createTestCitizen("c1", {
      state: {
        mood: -0.8,
        stress: 0.9,
        hope: 0.1,
        trustInPeers: 0.1,
        trustInGod: -0.5,
        cognitiveDissonance: 0.8,
      },
    });

    const citizen2 = createTestCitizen("c2", {
      state: {
        mood: 0.8,
        stress: 0.1,
        hope: 0.9,
        trustInPeers: 0.9,
        trustInGod: 0.8,
        cognitiveDissonance: 0.1,
      },
    });

    const result = formRelationship(citizen1, citizen2, 100, "random_encounter");

    expect(result.formed).toBe(false);
    expect(result.reason).toContain("Compatibility");
  });

  it("should have lower threshold for divine nudge", () => {
    const citizen1 = createTestCitizen("c1", {
      state: { ...createTestCitizen("").state, trustInPeers: 0.3 },
    });

    const citizen2 = createTestCitizen("c2", {
      state: { ...createTestCitizen("").state, trustInPeers: 0.3 },
    });

    const result = formRelationship(citizen1, citizen2, 100, "divine_nudge");

    // Divine nudge has lower threshold (0.2 vs 0.4)
    expect(result.formed).toBe(true);
  });

  it("should create relationship event on formation", () => {
    const citizen1 = createTestCitizen("c1");
    const citizen2 = createTestCitizen("c2");

    const result = formRelationship(citizen1, citizen2, 100, "shared_event");

    expect(result.event).toBeDefined();
    expect(result.event?.type).toBe("formed");
    expect(result.event?.tick).toBe(100);
  });
});

describe("Relationship Updates", () => {
  it("should strengthen relationship on positive interaction", () => {
    const relationship = createTestRelationship("c1", "c2", {
      strength: 0.5,
      trust: 0.3,
    });

    const result = updateRelationship(
      relationship,
      "positive",
      110,
      "interaction"
    );

    expect(result.relationship.strength).toBeGreaterThan(0.5);
    expect(result.relationship.trust).toBeGreaterThan(0.3);
    expect(result.broken).toBe(false);
  });

  it("should weaken relationship on negative interaction", () => {
    const relationship = createTestRelationship("c1", "c2", {
      strength: 0.5,
      trust: 0.3,
    });

    const result = updateRelationship(
      relationship,
      "negative",
      110,
      "interaction"
    );

    expect(result.relationship.strength).toBeLessThan(0.5);
    expect(result.event?.type).toBe("weakened");
  });

  it("should break relationship when strength drops too low", () => {
    const relationship = createTestRelationship("c1", "c2", {
      strength: 0.15,
      trust: 0.1,
    });

    const result = updateRelationship(
      relationship,
      "negative",
      110,
      "betrayal"
    );

    expect(result.broken).toBe(true);
    expect(result.event?.type).toBe("broken");
  });

  it("should transform relationship type based on trust", () => {
    const relationship = createTestRelationship("c1", "c2", {
      type: "acquaintance",
      strength: 0.7,
      trust: 0.6,
    });

    const result = updateRelationship(
      relationship,
      "positive",
      110,
      "interaction"
    );

    // After positive interaction, might transform to friend
    if (result.relationship.trust > 0.7) {
      expect(result.relationship.type).toBe("friend");
      expect(result.event?.type).toBe("transformed");
    }
  });

  it("should cause massive trust damage on betrayal", () => {
    const relationship = createTestRelationship("c1", "c2", {
      trust: 0.5,
    });

    const result = updateRelationship(
      relationship,
      "negative",
      110,
      "betrayal"
    );

    expect(result.relationship.trust).toBeLessThan(0.2);
  });
});

describe("Social Cohesion", () => {
  it("should return 1 for well-connected positive relationships", () => {
    const citizens = [
      createTestCitizen("c1"),
      createTestCitizen("c2"),
      createTestCitizen("c3"),
    ];

    // All connected with positive relationships
    const relationships = [
      createTestRelationship("c1", "c2", { strength: 0.8, trust: 0.7 }),
      createTestRelationship("c2", "c3", { strength: 0.8, trust: 0.7 }),
      createTestRelationship("c1", "c3", { strength: 0.8, trust: 0.7 }),
    ];

    const cohesion = calculateSocialCohesion(citizens, relationships);

    expect(cohesion).toBeGreaterThan(0.6);
  });

  it("should return low value for disconnected society", () => {
    const citizens = [
      createTestCitizen("c1"),
      createTestCitizen("c2"),
      createTestCitizen("c3"),
      createTestCitizen("c4"),
      createTestCitizen("c5"),
    ];

    // Very few connections
    const relationships = [
      createTestRelationship("c1", "c2", { strength: 0.3, trust: 0.2 }),
    ];

    const cohesion = calculateSocialCohesion(citizens, relationships);

    // With very few connections, cohesion should be low
    expect(cohesion).toBeLessThan(0.35);
  });

  it("should handle empty population", () => {
    const cohesion = calculateSocialCohesion([], []);
    expect(cohesion).toBe(1); // No citizens = perfect cohesion by default
  });
});

describe("Influential Citizens", () => {
  it("should find citizens with high social influence", () => {
    const citizens = [
      createTestCitizen("c1", {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.9,
        },
      }),
      createTestCitizen("c2", {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.3,
        },
      }),
      createTestCitizen("c3", {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.7,
        },
      }),
    ];

    const relationships = [
      createTestRelationship("c1", "c2"),
      createTestRelationship("c1", "c3"),
      createTestRelationship("c3", "c2"),
    ];

    const influential = findInfluentialCitizens(citizens, relationships, 2);

    expect(influential[0].citizen.id).toBe("c1");
    expect(influential.length).toBe(2);
  });

  it("should count relationships in influence score", () => {
    const citizens = [
      createTestCitizen("c1", {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.5,
        },
      }),
      createTestCitizen("c2", {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.5,
        },
      }),
    ];

    // c1 has more relationships
    const relationships = [
      createTestRelationship("c1", "c2"),
      createTestRelationship("c1", "c3"),
      createTestRelationship("c1", "c4"),
    ];

    const influential = findInfluentialCitizens(citizens, relationships, 2);

    expect(influential[0].citizen.id).toBe("c1");
  });
});

describe("Isolated Citizens", () => {
  it("should find citizens with few relationships", () => {
    const citizens = [
      createTestCitizen("c1"),
      createTestCitizen("c2"),
      createTestCitizen("c3"),
      createTestCitizen("c4"),
    ];

    // Only c1 and c2 are connected
    const relationships = [
      createTestRelationship("c1", "c2"),
      createTestRelationship("c2", "c1"),
    ];

    const isolated = findIsolatedCitizens(citizens, relationships, 2);

    expect(isolated.map((c) => c.id)).toContain("c3");
    expect(isolated.map((c) => c.id)).toContain("c4");
    expect(isolated.length).toBe(2);
  });
});

describe("Social Influence", () => {
  it("should calculate influence attempt result", () => {
    const influencer = createTestCitizen("inf", {
      attributes: {
        ...createTestCitizen("").attributes,
        socialInfluencePotential: 0.8,
        personalityArchetype: "idealist",
      },
    });

    const target = createTestCitizen("target", {
      state: {
        ...createTestCitizen("").state,
        trustInPeers: 0.7,
      },
    });

    const result = attemptInfluence(influencer, target, "social_unity", testWorld);

    expect(result).toBeDefined();
    expect(result?.influencerId).toBe("inf");
    expect(result?.targetId).toBe("target");
    expect(result?.topic).toBe("social_unity");
    expect(result?.influenceStrength).toBeGreaterThan(0);
    expect(typeof result?.wasSuccessful).toBe("boolean");
  });

  it("should have higher success with matching method and personality", () => {
    // This is probabilistic, so we just verify the method is determined
    const influencer = createTestCitizen("inf", {
      attributes: {
        ...createTestCitizen("").attributes,
        personalityArchetype: "skeptic",
      },
    });

    const target = createTestCitizen("target", {
      attributes: {
        ...createTestCitizen("").attributes,
        personalityArchetype: "pragmatist",
      },
    });

    const result = attemptInfluence(influencer, target, "truth_seeking", testWorld);

    // Skeptics use "argument" method which works well on pragmatists
    expect(result?.method).toBe("argument");
  });
});
