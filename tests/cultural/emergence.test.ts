/**
 * Cultural Emergence Tests - Phase 2
 */

import { describe, it, expect } from "vitest";
import {
  detectEmergingMovement,
  updateMovement,
  generateCollectiveEvent,
  updateCulturalTrends,
} from "@/lib/cultural/emergence";
import type { Citizen, CitizenBelief } from "@/types/citizen";
import type { WorldState, CulturalTrend } from "@/types/world";
import type { CulturalMovement } from "@/types/social";

function createTestCitizen(
  id: string,
  beliefs: CitizenBelief[] = [],
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
    beliefs,
    createdAtTick: 0,
    lastActiveTick: 10,
    ...overrides,
  };
}

function createTestBelief(
  topic: string,
  stance: number,
  confidence: number = 0.7
): CitizenBelief {
  return {
    id: `belief-${topic}-${Math.random()}`,
    topic,
    stance,
    confidence,
    origin: "social",
    formedAtTick: 50,
  };
}

const testWorld: WorldState = {
  id: "test-world",
  userId: "test-user",
  config: {
    name: "Test World",
    populationSize: 20,
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

describe("Movement Detection", () => {
  it("should detect movement when enough citizens share beliefs", () => {
    // Create 10 citizens, 5 with strong pro-divine beliefs
    const believers = Array.from({ length: 5 }, (_, i) =>
      createTestCitizen(`b${i}`, [createTestBelief("divine_trust", 0.7)], {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.6,
        },
      })
    );

    const others = Array.from({ length: 5 }, (_, i) =>
      createTestCitizen(`o${i}`, [createTestBelief("daily_life", 0.3)])
    );

    const allCitizens = [...believers, ...others];

    const result = detectEmergingMovement(allCitizens, [], testWorld);

    expect(result.detected).toBe(true);
    expect(result.movement).toBeDefined();
    expect(result.movement?.divineRelation).toBe("pro_divine");
  });

  it("should not detect movement for weak beliefs", () => {
    // Citizens with beliefs below threshold
    const citizens = Array.from({ length: 10 }, (_, i) =>
      createTestCitizen(`c${i}`, [createTestBelief("some_topic", 0.2)])
    );

    const result = detectEmergingMovement(citizens, [], testWorld);

    expect(result.detected).toBe(false);
  });

  it("should not create duplicate movements", () => {
    const believers = Array.from({ length: 5 }, (_, i) =>
      createTestCitizen(`b${i}`, [createTestBelief("existing_topic", 0.7)])
    );

    const existingMovement: CulturalMovement = {
      id: "existing",
      worldId: "test-world",
      name: "Existing Movement",
      description: "Already exists",
      coreBeliefs: [{ topic: "existing_topic", stance: 0.6 }],
      stage: "growing",
      leaderIds: [],
      followerIds: [],
      influence: 0.3,
      divineRelation: "agnostic",
      emergedAtTick: 50,
      lastActivityTick: 90,
      history: [],
    };

    const result = detectEmergingMovement(believers, [existingMovement], testWorld);

    expect(result.detected).toBe(false);
    expect(result.reason).toContain("No emerging movements");
  });

  it("should select highest influence citizen as founder", () => {
    const highInfluence = createTestCitizen(
      "leader",
      [createTestBelief("new_belief", 0.8)],
      {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.95,
        },
      }
    );

    const others = Array.from({ length: 4 }, (_, i) =>
      createTestCitizen(`f${i}`, [createTestBelief("new_belief", 0.7)], {
        attributes: {
          ...createTestCitizen("").attributes,
          socialInfluencePotential: 0.3,
        },
      })
    );

    const result = detectEmergingMovement(
      [highInfluence, ...others],
      [],
      testWorld
    );

    expect(result.movement?.founderId).toBe("leader");
    expect(result.movement?.leaderIds).toContain("leader");
  });
});

describe("Movement Updates", () => {
  it("should update follower count based on belief alignment", () => {
    const movement: CulturalMovement = {
      id: "test-movement",
      worldId: "test-world",
      name: "Test Movement",
      description: "Test",
      coreBeliefs: [{ topic: "core_belief", stance: 0.7 }],
      stage: "nascent",
      leaderIds: ["l1"],
      followerIds: ["l1", "f1"],
      influence: 0.1,
      divineRelation: "agnostic",
      emergedAtTick: 50,
      lastActivityTick: 90,
      history: [],
    };

    // More citizens now align with the belief
    const citizens = Array.from({ length: 10 }, (_, i) =>
      createTestCitizen(`c${i}`, [createTestBelief("core_belief", 0.6)])
    );

    const result = updateMovement(movement, citizens, testWorld);

    expect(result.movement.followerIds.length).toBeGreaterThan(2);
  });

  it("should transition from nascent to growing", () => {
    const movement: CulturalMovement = {
      id: "test-movement",
      worldId: "test-world",
      name: "Growing Movement",
      description: "Test",
      coreBeliefs: [{ topic: "growing_belief", stance: 0.8 }],
      stage: "nascent",
      leaderIds: [],
      followerIds: [],
      influence: 0.15,
      divineRelation: "agnostic",
      emergedAtTick: 50,
      lastActivityTick: 90,
      history: [],
    };

    // 20% of citizens (4 out of 20) follow
    const followers = Array.from({ length: 4 }, (_, i) =>
      createTestCitizen(`f${i}`, [createTestBelief("growing_belief", 0.7)])
    );

    const others = Array.from({ length: 16 }, (_, i) =>
      createTestCitizen(`o${i}`, [createTestBelief("other", 0.5)])
    );

    const result = updateMovement(movement, [...followers, ...others], testWorld);

    expect(result.stageChanged).toBe(true);
    expect(result.newStage).toBe("growing");
    expect(result.movement.stage).toBe("growing");
  });

  it("should decline when followers drop", () => {
    const movement: CulturalMovement = {
      id: "test-movement",
      worldId: "test-world",
      name: "Declining Movement",
      description: "Test",
      coreBeliefs: [{ topic: "declining_belief", stance: 0.8 }],
      stage: "growing",
      leaderIds: [],
      followerIds: ["f1", "f2", "f3", "f4", "f5"],
      influence: 0.2,
      divineRelation: "agnostic",
      emergedAtTick: 50,
      lastActivityTick: 90,
      history: [],
    };

    // Only 1 citizen still follows (5% of 20)
    const follower = createTestCitizen("f1", [
      createTestBelief("declining_belief", 0.6),
    ]);

    const others = Array.from({ length: 19 }, (_, i) =>
      createTestCitizen(`o${i}`, [createTestBelief("other_belief", 0.5)])
    );

    const result = updateMovement(movement, [follower, ...others], testWorld);

    expect(result.stageChanged).toBe(true);
    expect(result.newStage).toBe("declining");
  });
});

describe("Collective Events", () => {
  it("should generate celebration event", () => {
    const citizens = Array.from({ length: 5 }, (_, i) =>
      createTestCitizen(`c${i}`)
    );

    const result = generateCollectiveEvent(
      "celebration",
      citizens,
      testWorld,
      undefined,
      false
    );

    expect(result.event.type).toBe("celebration");
    expect(result.event.affectedCitizenIds).toHaveLength(5);
    expect(result.worldUpdates.stabilityChange).toBeGreaterThan(0);
    expect(result.citizenUpdates.size).toBe(5);
  });

  it("should generate crisis event with negative impacts", () => {
    const citizens = Array.from({ length: 5 }, (_, i) =>
      createTestCitizen(`c${i}`)
    );

    const result = generateCollectiveEvent(
      "crisis",
      citizens,
      testWorld,
      undefined,
      false
    );

    expect(result.event.type).toBe("crisis");
    expect(result.worldUpdates.stabilityChange).toBeLessThan(0);
    expect(result.event.outcomes.averageMoodChange).toBeLessThan(0);
  });

  it("should mark divine events correctly", () => {
    const citizens = [createTestCitizen("c1")];

    const result = generateCollectiveEvent(
      "miracle",
      citizens,
      testWorld,
      undefined,
      true
    );

    expect(result.event.divinelyInfluenced).toBe(true);
    expect(result.event.type).toBe("miracle");
  });

  it("should link event to movement", () => {
    const movement: CulturalMovement = {
      id: "movement-1",
      worldId: "test-world",
      name: "Test Movement",
      description: "Test",
      coreBeliefs: [],
      stage: "growing",
      leaderIds: [],
      followerIds: [],
      influence: 0.3,
      divineRelation: "pro_divine",
      emergedAtTick: 50,
      lastActivityTick: 90,
      history: [],
    };

    const citizens = [createTestCitizen("c1")];

    const result = generateCollectiveEvent(
      "revelation",
      citizens,
      testWorld,
      movement,
      false
    );

    expect(result.event.movementId).toBe("movement-1");
  });

  it("should update citizen states based on event type", () => {
    const citizen = createTestCitizen("c1", [], {
      state: {
        mood: 0,
        stress: 0.5,
        hope: 0.5,
        trustInPeers: 0.5,
        trustInGod: 0.3,
        cognitiveDissonance: 0.2,
      },
    });

    const celebrationResult = generateCollectiveEvent(
      "celebration",
      [citizen],
      testWorld
    );

    const celebrationUpdate = celebrationResult.citizenUpdates.get("c1");
    expect(celebrationUpdate?.mood).toBeGreaterThan(0);
    expect(celebrationUpdate?.stress).toBeLessThan(0.5);

    const crisisResult = generateCollectiveEvent("crisis", [citizen], testWorld);

    const crisisUpdate = crisisResult.citizenUpdates.get("c1");
    expect(crisisUpdate?.stress).toBeGreaterThan(0.5);
  });
});

describe("Cultural Trends", () => {
  it("should create new trends from belief clusters", () => {
    const citizens = Array.from({ length: 5 }, (_, i) =>
      createTestCitizen(`c${i}`, [createTestBelief("new_trend", 0.6)])
    );

    const result = updateCulturalTrends([], citizens, testWorld);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((t) => t.name === "new_trend")).toBe(true);
  });

  it("should update existing trend strength", () => {
    const existingTrend: CulturalTrend = {
      id: "trend-1",
      worldId: "test-world",
      name: "existing_trend",
      type: "belief",
      strength: 0.3,
      participantCount: 3,
      emergedAtTick: 50,
      description: "Test trend",
    };

    // More citizens now have this belief
    const citizens = Array.from({ length: 6 }, (_, i) =>
      createTestCitizen(`c${i}`, [createTestBelief("existing_trend", 0.7)])
    );

    const result = updateCulturalTrends([existingTrend], citizens, testWorld);

    const updated = result.find((t) => t.name === "existing_trend");
    expect(updated?.participantCount).toBe(6);
  });

  it("should decline trends that lose followers", () => {
    const existingTrend: CulturalTrend = {
      id: "trend-1",
      worldId: "test-world",
      name: "declining_trend",
      type: "belief",
      strength: 0.5,
      participantCount: 10,
      emergedAtTick: 50,
      description: "Test trend",
    };

    // No citizens have this belief anymore
    const citizens = Array.from({ length: 10 }, (_, i) =>
      createTestCitizen(`c${i}`, [createTestBelief("other_belief", 0.5)])
    );

    const result = updateCulturalTrends([existingTrend], citizens, testWorld);

    const updated = result.find((t) => t.name === "declining_trend");
    if (updated) {
      expect(updated.strength).toBeLessThan(0.5);
    }
  });
});

describe("Movement Stages", () => {
  const stages = [
    "nascent",
    "growing",
    "mainstream",
    "dominant",
    "declining",
    "underground",
    "extinct",
  ];

  it("should have valid stage progression", () => {
    expect(stages).toHaveLength(7);
    expect(stages[0]).toBe("nascent");
    expect(stages[stages.length - 1]).toBe("extinct");
  });

  it("should not allow extinct movements to recover", () => {
    const movement: CulturalMovement = {
      id: "extinct-movement",
      worldId: "test-world",
      name: "Dead Movement",
      description: "No longer exists",
      coreBeliefs: [{ topic: "dead_belief", stance: 0.8 }],
      stage: "extinct",
      leaderIds: [],
      followerIds: [],
      influence: 0,
      divineRelation: "agnostic",
      emergedAtTick: 10,
      lastActivityTick: 50,
      history: [],
    };

    // Even with new followers, extinct movements stay extinct
    const citizens = Array.from({ length: 10 }, (_, i) =>
      createTestCitizen(`c${i}`, [createTestBelief("dead_belief", 0.9)])
    );

    const result = updateMovement(movement, citizens, testWorld);

    expect(result.movement.stage).toBe("extinct");
    expect(result.stageChanged).toBe(false);
  });
});
