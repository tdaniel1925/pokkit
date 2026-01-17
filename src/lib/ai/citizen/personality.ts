/**
 * POKKIT Citizen Personality System
 *
 * Based on PRD Section 5.1 - Static Attributes
 * Generates and manages citizen personalities.
 */

import {
  PersonalityArchetypes,
  type CitizenAttributes,
  type PersonalityArchetype,
} from "@/types/citizen";

// Personality archetype descriptions for AI prompts
export const ARCHETYPE_DESCRIPTIONS: Record<PersonalityArchetype, string> = {
  skeptic:
    "Questions everything, demands evidence, distrustful of authority and divine claims. Values logic and proof.",
  believer:
    "Naturally inclined toward faith, sees divine signs in everyday events, trusts in higher purpose.",
  pragmatist:
    "Focuses on practical outcomes, judges actions by results, less concerned with abstract beliefs.",
  idealist:
    "Believes in higher ideals, strives for perfect outcomes, can be disappointed by reality.",
  rebel:
    "Challenges established norms, questions authority, values independence and freedom.",
  conformist:
    "Values social harmony, follows group norms, uncomfortable with deviation from tradition.",
  seeker:
    "Actively searches for meaning and truth, open to new ideas, spiritually curious.",
  cynic:
    "Assumes negative motivations, expects disappointment, protective through pessimism.",
};

// Generate random personality attributes
export function generateRandomAttributes(): CitizenAttributes {
  const archetypes = PersonalityArchetypes;
  const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

  // Base attributes influenced by archetype
  const baseAttributes = getArchetypeBaseAttributes(archetype);

  // Add some randomness
  return {
    personalityArchetype: archetype,
    emotionalSensitivity: clamp(baseAttributes.emotionalSensitivity + randomVariance(0.2)),
    authorityTrustBias: clamp(baseAttributes.authorityTrustBias + randomVariance(0.3), -1, 1),
    socialInfluencePotential: clamp(baseAttributes.socialInfluencePotential + randomVariance(0.2)),
    curiosityAboutDivinity: clamp(baseAttributes.curiosityAboutDivinity + randomVariance(0.2)),
  };
}

// Get base attributes for an archetype
function getArchetypeBaseAttributes(
  archetype: PersonalityArchetype
): Omit<CitizenAttributes, "personalityArchetype"> {
  switch (archetype) {
    case "skeptic":
      return {
        emotionalSensitivity: 0.4,
        authorityTrustBias: -0.5,
        socialInfluencePotential: 0.5,
        curiosityAboutDivinity: 0.3,
      };
    case "believer":
      return {
        emotionalSensitivity: 0.7,
        authorityTrustBias: 0.6,
        socialInfluencePotential: 0.4,
        curiosityAboutDivinity: 0.8,
      };
    case "pragmatist":
      return {
        emotionalSensitivity: 0.3,
        authorityTrustBias: 0.1,
        socialInfluencePotential: 0.6,
        curiosityAboutDivinity: 0.3,
      };
    case "idealist":
      return {
        emotionalSensitivity: 0.8,
        authorityTrustBias: 0.3,
        socialInfluencePotential: 0.5,
        curiosityAboutDivinity: 0.6,
      };
    case "rebel":
      return {
        emotionalSensitivity: 0.5,
        authorityTrustBias: -0.7,
        socialInfluencePotential: 0.7,
        curiosityAboutDivinity: 0.4,
      };
    case "conformist":
      return {
        emotionalSensitivity: 0.5,
        authorityTrustBias: 0.7,
        socialInfluencePotential: 0.3,
        curiosityAboutDivinity: 0.5,
      };
    case "seeker":
      return {
        emotionalSensitivity: 0.6,
        authorityTrustBias: 0.2,
        socialInfluencePotential: 0.4,
        curiosityAboutDivinity: 0.9,
      };
    case "cynic":
      return {
        emotionalSensitivity: 0.6,
        authorityTrustBias: -0.6,
        socialInfluencePotential: 0.4,
        curiosityAboutDivinity: 0.2,
      };
  }
}

// Build a personality prompt for AI generation
export function buildPersonalityPrompt(attributes: CitizenAttributes): string {
  const archetype = attributes.personalityArchetype;
  const description = ARCHETYPE_DESCRIPTIONS[archetype];

  let prompt = `You are a ${archetype}. ${description}\n\n`;

  // Add nuanced traits
  if (attributes.emotionalSensitivity > 0.7) {
    prompt += "You feel emotions deeply and express them readily. ";
  } else if (attributes.emotionalSensitivity < 0.3) {
    prompt += "You tend to be emotionally reserved and analytical. ";
  }

  if (attributes.authorityTrustBias > 0.5) {
    prompt += "You generally trust authority figures and divine guidance. ";
  } else if (attributes.authorityTrustBias < -0.5) {
    prompt += "You are deeply skeptical of authority and question divine motives. ";
  }

  if (attributes.socialInfluencePotential > 0.7) {
    prompt += "Others often look to you for guidance and are swayed by your opinions. ";
  }

  if (attributes.curiosityAboutDivinity > 0.7) {
    prompt += "You are deeply curious about the nature of the divine and seek spiritual understanding. ";
  } else if (attributes.curiosityAboutDivinity < 0.3) {
    prompt += "You have little interest in divine matters and focus on earthly concerns. ";
  }

  return prompt.trim();
}

// Utility functions
function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function randomVariance(amount: number): number {
  return (Math.random() - 0.5) * 2 * amount;
}

// Generate a citizen name
const FIRST_NAMES = [
  "Aria", "Marcus", "Elena", "Theo", "Luna", "Felix", "Maya", "Oscar",
  "Iris", "Leo", "Nova", "Atlas", "Sage", "River", "Quinn", "Zara",
  "Cyrus", "Vera", "Orion", "Lyra", "Kai", "Ada", "Sol", "Nyx",
];

const LAST_NAMES = [
  "Winters", "Stone", "Rivers", "Blake", "Moore", "Reed", "Gray", "Wells",
  "Cross", "Vale", "Frost", "Dawn", "Night", "Storm", "Light", "Shadow",
  "Oak", "Thorn", "Swift", "Bright", "Hollow", "Glen", "Marsh", "Hill",
];

export function generateCitizenName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}
