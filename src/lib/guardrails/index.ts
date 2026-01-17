/**
 * POKKIT GUARDRAIL SYSTEM
 *
 * This module is the safety layer for the entire simulation.
 * It is MANDATORY and CANNOT be bypassed.
 *
 * Exports:
 * - checkGuardrails: Main entry point for all content checks
 * - checkDivineAction: Check god actions with consent
 * - checkCitizenContent: Check citizen-generated content
 * - Rules and constants for safety detection
 */

// Main middleware
export {
  checkGuardrails,
  checkDivineAction,
  checkCitizenContent,
  getRecentSafetyEvents,
  hasRepeatedInterventions,
} from "./middleware";

// Rules and detection
export {
  detectHardViolations,
  determineSafetyLevel,
  CRISIS_RESOURCES,
  getDeEscalationResponse,
} from "./rules";

// Intervention system
export {
  determineIntervention,
  shouldProactivelyIntervene,
  generateWellnessCheck,
  type InterventionContext,
  type InterventionResult,
} from "./intervention";

// Consent system
export {
  checkConsentViolation,
  applyConsentConsequences,
  isApproachingConsentLimit,
  type ConsentCheckInput,
} from "./consent";
