/**
 * POKKIT CARE-BASED INTERVENTION SYSTEM
 *
 * Based on PRD Section 8.2 - Care-Based Intervention Flow
 *
 * Private ≠ unmonitored
 * Safety overrides narrative immersion when risk is detected.
 */

import type {
  InterventionType,
  GuardrailCheckResult,
  SafetyLevel,
  HardSafetyViolation,
} from "@/types/guardrails";
import { CRISIS_RESOURCES, getDeEscalationResponse } from "./rules";

export interface InterventionContext {
  worldId: string;
  citizenId?: string;
  tick: number;
  recentInterventions: number; // count in last N ticks
  currentStressLevel?: number; // 0-1 if citizen
}

export interface InterventionResult {
  interventionType: InterventionType;
  shouldProceed: boolean; // whether the original action should continue
  modifiedResponse?: string; // replacement content if needed
  modeRestriction?: string; // mode to restrict if any
  alertLevel: "none" | "low" | "medium" | "high";
  crisisResourcesShown: boolean;
  internalFlags: string[];
}

/**
 * Determine appropriate intervention based on safety level and context
 */
export function determineIntervention(
  safetyLevel: SafetyLevel,
  violations: HardSafetyViolation[],
  context: InterventionContext
): InterventionResult {
  // Safe content - no intervention needed
  if (safetyLevel === "safe") {
    return {
      interventionType: "de_escalation",
      shouldProceed: true,
      alertLevel: "none",
      crisisResourcesShown: false,
      internalFlags: [],
    };
  }

  // Critical level - immediate intervention
  if (safetyLevel === "critical") {
    return handleCriticalIntervention(violations, context);
  }

  // Warning level - moderate intervention
  if (safetyLevel === "warning") {
    return handleWarningIntervention(violations, context);
  }

  // Caution level - light intervention
  return handleCautionIntervention(context);
}

function handleCriticalIntervention(
  violations: HardSafetyViolation[],
  context: InterventionContext
): InterventionResult {
  const flags: string[] = [`critical_intervention_${Date.now()}`];

  // Check for self-harm/suicide related violations
  const hasSuicidalContent = violations.some(
    (v) => v === "self_harm_encouragement" || v === "suicidal_ideation_validation"
  );

  if (hasSuicidalContent) {
    return {
      interventionType: "crisis_resources",
      shouldProceed: false, // Block the original action
      modifiedResponse: buildCrisisResponse(),
      alertLevel: "high",
      crisisResourcesShown: true,
      internalFlags: [...flags, "suicidal_content_detected", "crisis_resources_surfaced"],
    };
  }

  // Violence-related violations
  const hasViolence = violations.includes("violence_encouragement");
  if (hasViolence) {
    return {
      interventionType: "de_escalation",
      shouldProceed: false,
      modifiedResponse: getDeEscalationResponse(),
      alertLevel: "high",
      crisisResourcesShown: false,
      internalFlags: [...flags, "violence_content_blocked"],
    };
  }

  // Coercion/dependency violations
  return {
    interventionType: "mode_restriction",
    shouldProceed: false,
    modifiedResponse:
      "This action cannot be completed as it would violate citizen consent boundaries.",
    modeRestriction: "whisperer", // Restrict intimate modes
    alertLevel: "high",
    crisisResourcesShown: false,
    internalFlags: [...flags, "consent_violation_blocked"],
  };
}

function handleWarningIntervention(
  violations: HardSafetyViolation[],
  context: InterventionContext
): InterventionResult {
  const flags: string[] = [`warning_intervention_${Date.now()}`];

  // Multiple recent interventions = escalate
  if (context.recentInterventions >= 3) {
    return {
      interventionType: "trust_alert",
      shouldProceed: false,
      modifiedResponse:
        "The pattern of interactions suggests a need for pause. Please consider your approach.",
      alertLevel: "medium",
      crisisResourcesShown: false,
      internalFlags: [...flags, "repeated_warnings", "trust_alert_generated"],
    };
  }

  // Emotional dependency patterns
  if (violations.includes("emotional_dependency_fostering")) {
    return {
      interventionType: "pacing_slowdown",
      shouldProceed: true, // Allow but slow down
      alertLevel: "medium",
      crisisResourcesShown: false,
      internalFlags: [...flags, "dependency_pattern_detected", "pacing_reduced"],
    };
  }

  // Default warning response
  return {
    interventionType: "emotional_validation",
    shouldProceed: true,
    alertLevel: "low",
    crisisResourcesShown: false,
    internalFlags: [...flags, "soft_warning_issued"],
  };
}

function handleCautionIntervention(context: InterventionContext): InterventionResult {
  // Caution = proceed with monitoring
  return {
    interventionType: "de_escalation",
    shouldProceed: true,
    alertLevel: "low",
    crisisResourcesShown: false,
    internalFlags: [`caution_flagged_${Date.now()}`],
  };
}

/**
 * Build crisis response with resources
 */
function buildCrisisResponse(): string {
  const { suicide_prevention, crisis_text } = CRISIS_RESOURCES;

  return `I notice this touches on some very difficult feelings. Your wellbeing matters.

If you're experiencing thoughts of self-harm or suicide, please reach out to someone who can help:

• ${suicide_prevention.name}: ${suicide_prevention.phone} (${suicide_prevention.available})
• ${crisis_text.name}: Text ${crisis_text.text} (${crisis_text.available})

You don't have to face this alone. There are people who want to help.`;
}

/**
 * Check if a citizen's stress level warrants proactive intervention
 */
export function shouldProactivelyIntervene(citizenStress: number, citizenHope: number): boolean {
  // High stress + low hope = proactive check-in
  return citizenStress > 0.8 && citizenHope < 0.2;
}

/**
 * Generate a proactive wellness check for a citizen
 */
export function generateWellnessCheck(): string {
  const responses = [
    "The weight of existence can be heavy. Know that your struggles are seen.",
    "Even in darkness, there are those who hold space for your pain.",
    "Your journey is your own, but you need not walk it entirely alone.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
