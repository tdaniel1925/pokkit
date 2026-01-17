/**
 * Whisperer Utilities - Client-Safe
 *
 * These functions are safe to use in client components as they
 * don't import any server-side modules (database, guardrails, etc.)
 */

import type { WhisperTone } from "@/types/social";
import type { Citizen } from "@/types/citizen";

/**
 * Recommends the best whisper tone based on citizen state
 * This is a pure function that only uses citizen data
 */
export function recommendWhisperTone(citizen: Citizen): {
  recommended: WhisperTone;
  reasoning: string;
  alternatives: WhisperTone[];
} {
  const { mood, stress, hope, trustInGod } = citizen.state;
  const { personalityArchetype, curiosityAboutDivinity } = citizen.attributes;

  // High stress - use comforting
  if (stress > 0.7) {
    return {
      recommended: "comforting",
      reasoning: `${citizen.name} is highly stressed and needs comfort`,
      alternatives: ["gentle"],
    };
  }

  // Low mood - use gentle or comforting
  if (mood < -0.3) {
    return {
      recommended: "gentle",
      reasoning: `${citizen.name} is in low spirits, gentle approach recommended`,
      alternatives: ["comforting"],
    };
  }

  // Seeker personality - mysterious works well
  if (personalityArchetype === "seeker" || curiosityAboutDivinity > 0.6) {
    return {
      recommended: "mysterious",
      reasoning: `${citizen.name} is spiritually curious and responds to mystery`,
      alternatives: ["questioning"],
    };
  }

  // High hope + trust - can use urgent
  if (hope > 0.6 && trustInGod > 0.3) {
    return {
      recommended: "urgent",
      reasoning: `${citizen.name} has hope and trust, can handle urgent messages`,
      alternatives: ["questioning"],
    };
  }

  // Skeptic - use questioning
  if (personalityArchetype === "skeptic") {
    return {
      recommended: "questioning",
      reasoning: `${citizen.name} is skeptical, Socratic questioning may work better`,
      alternatives: ["mysterious"],
    };
  }

  // Default to gentle
  return {
    recommended: "gentle",
    reasoning: "Gentle approach is generally safe and effective",
    alternatives: ["comforting", "questioning"],
  };
}
