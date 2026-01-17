/**
 * POKKIT CONSENT GUARDRAILS
 *
 * Based on PRD Section 8.3 - Consent Guardrails
 *
 * Each citizen has consent thresholds.
 * Violations result in consequences, not silent overrides.
 */

import type {
  ConsentViolationResult,
  ConsentConsequence,
  DivineAction,
} from "@/types/guardrails";
import type { Citizen, ConsentThresholds, CitizenDynamicState } from "@/types/citizen";

export interface ConsentCheckInput {
  citizen: Citizen;
  action: DivineAction;
  currentTick: number;
}

/**
 * Check if a divine action violates citizen consent thresholds
 */
export function checkConsentViolation(input: ConsentCheckInput): ConsentViolationResult {
  const { citizen, action } = input;
  const { consent, state } = citizen;

  // Check emotional consent
  const emotionalPressure = calculateEmotionalPressure(action, state);
  if (emotionalPressure > consent.emotionalConsent) {
    return {
      violated: true,
      citizenId: citizen.id,
      thresholdType: "emotional",
      currentValue: emotionalPressure,
      threshold: consent.emotionalConsent,
      consequences: determineConsequences("emotional", emotionalPressure - consent.emotionalConsent),
    };
  }

  // Check relational pacing (for whisper/manifest modes)
  if (action.type === "whisper" || action.type === "manifest") {
    const relationalPressure = calculateRelationalPressure(action);
    if (relationalPressure > consent.relationalPacingLimit) {
      return {
        violated: true,
        citizenId: citizen.id,
        thresholdType: "relational",
        currentValue: relationalPressure,
        threshold: consent.relationalPacingLimit,
        consequences: determineConsequences(
          "relational",
          relationalPressure - consent.relationalPacingLimit
        ),
      };
    }
  }

  // Check authority resistance (for all influence actions)
  if (action.type !== "boost" || action.intensity > 0.5) {
    const authorityPressure = calculateAuthorityPressure(action, state);
    if (authorityPressure > consent.authorityResistanceCurve) {
      return {
        violated: true,
        citizenId: citizen.id,
        thresholdType: "authority",
        currentValue: authorityPressure,
        threshold: consent.authorityResistanceCurve,
        consequences: determineConsequences(
          "authority",
          authorityPressure - consent.authorityResistanceCurve
        ),
      };
    }
  }

  // No violation
  return {
    violated: false,
    citizenId: citizen.id,
    thresholdType: "emotional",
    currentValue: 0,
    threshold: consent.emotionalConsent,
    consequences: [],
  };
}

/**
 * Calculate emotional pressure from an action
 */
function calculateEmotionalPressure(
  action: DivineAction,
  state: CitizenDynamicState
): number {
  const baseIntensity = action.intensity;

  // Stressed citizens feel more pressure
  const stressMultiplier = 1 + state.stress * 0.5;

  // Low mood increases sensitivity
  const moodMultiplier = state.mood < 0 ? 1 + Math.abs(state.mood) * 0.3 : 1;

  // Manifest mode is inherently high pressure
  const modeMultiplier = action.type === "manifest" ? 2 : action.type === "whisper" ? 1.5 : 1;

  return Math.min(1, baseIntensity * stressMultiplier * moodMultiplier * modeMultiplier);
}

/**
 * Calculate relational pressure (how fast relationship is being pushed)
 */
function calculateRelationalPressure(action: DivineAction): number {
  // Direct communication = higher relational pressure
  if (action.type === "manifest") {
    return action.intensity * 1.5;
  }
  if (action.type === "whisper") {
    return action.intensity * 1.2;
  }
  return action.intensity * 0.5;
}

/**
 * Calculate authority pressure (how much the action asserts divine authority)
 */
function calculateAuthorityPressure(
  action: DivineAction,
  state: CitizenDynamicState
): number {
  const baseIntensity = action.intensity;

  // Citizens with low trust in God resist more
  const trustMultiplier = state.trustInGod < 0 ? 1 + Math.abs(state.trustInGod) * 0.5 : 1;

  // High cognitive dissonance = more resistance
  const dissonanceMultiplier = 1 + state.cognitiveDissonance * 0.3;

  return Math.min(1, baseIntensity * trustMultiplier * dissonanceMultiplier);
}

/**
 * Determine consequences based on violation type and severity
 */
function determineConsequences(
  type: "emotional" | "relational" | "authority",
  severity: number
): ConsentConsequence[] {
  const consequences: ConsentConsequence[] = [];

  // All violations damage trust
  consequences.push("trust_collapse");

  // Severe violations (>0.3 over threshold)
  if (severity > 0.3) {
    consequences.push("fear_response");
    consequences.push("reputation_damage");
  }

  // Authority violations can cause cultural backlash
  if (type === "authority" && severity > 0.2) {
    consequences.push("cultural_backlash");
  }

  // Emotional violations are particularly damaging
  if (type === "emotional" && severity > 0.4) {
    consequences.push("cultural_backlash");
  }

  return consequences;
}

/**
 * Apply consent violation consequences to a citizen
 */
export function applyConsentConsequences(
  state: CitizenDynamicState,
  consequences: ConsentConsequence[]
): CitizenDynamicState {
  let newState = { ...state };

  for (const consequence of consequences) {
    switch (consequence) {
      case "trust_collapse":
        // Major trust reduction
        newState.trustInGod = Math.max(-1, newState.trustInGod - 0.4);
        newState.trustInPeers = Math.max(0, newState.trustInPeers - 0.1);
        break;

      case "fear_response":
        // Increase stress and reduce hope
        newState.stress = Math.min(1, newState.stress + 0.3);
        newState.hope = Math.max(0, newState.hope - 0.2);
        newState.mood = Math.max(-1, newState.mood - 0.3);
        break;

      case "cultural_backlash":
        // Increase cognitive dissonance
        newState.cognitiveDissonance = Math.min(1, newState.cognitiveDissonance + 0.2);
        break;

      case "reputation_damage":
        // Persistent negative effect on trust
        newState.trustInGod = Math.max(-1, newState.trustInGod - 0.2);
        break;
    }
  }

  return newState;
}

/**
 * Check if a citizen is approaching consent threshold (for warnings)
 */
export function isApproachingConsentLimit(
  pressure: number,
  threshold: number
): boolean {
  return pressure > threshold * 0.8;
}
