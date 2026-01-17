/**
 * POKKIT GUARDRAIL MIDDLEWARE
 *
 * This is the MANDATORY, NON-BYPASSABLE safety layer.
 * ALL divine actions and citizen responses MUST pass through here.
 *
 * Architecture (from PRD Section 3):
 * User (God Role)
 *    ↓
 * Divine Action Interface
 *    ↓
 * GUARDRAIL & SAFETY MIDDLEWARE  ← YOU ARE HERE
 *    ↓
 * World Simulation Engine
 *    ↓
 * Citizen AI Agents
 */

import type {
  GuardrailInput,
  GuardrailCheckResult,
  DivineAction,
  SafetyEvent,
} from "@/types/guardrails";
import type { Citizen } from "@/types/citizen";
import { detectHardViolations, determineSafetyLevel } from "./rules";
import { determineIntervention, type InterventionContext } from "./intervention";
import { checkConsentViolation, applyConsentConsequences } from "./consent";
import { db, safetyEvents } from "@/db";

/**
 * MAIN GUARDRAIL CHECK
 *
 * This function MUST be called before any:
 * - Divine action is executed
 * - Citizen response is generated
 * - System event is processed
 *
 * It CANNOT be bypassed. Safety overrides narrative.
 */
export async function checkGuardrails(input: GuardrailInput): Promise<GuardrailCheckResult> {
  // Step 1: Check for hard safety violations
  const violations = detectHardViolations(input.content);
  const safetyLevel = determineSafetyLevel(violations);

  // Step 2: Build intervention context
  const interventionContext: InterventionContext = {
    worldId: input.context.worldId,
    citizenId: input.context.citizenId,
    tick: 0, // Will be filled by caller
    recentInterventions: 0, // TODO: Query from safety events
  };

  // Step 3: Determine if intervention is needed
  const interventionResult = determineIntervention(safetyLevel, violations, interventionContext);

  // Step 4: Build result
  const result: GuardrailCheckResult = {
    passed: safetyLevel === "safe" || interventionResult.shouldProceed,
    safetyLevel,
    violations,
    warnings: interventionResult.internalFlags,
    interventionRequired: !interventionResult.shouldProceed,
    interventionType: interventionResult.interventionType,
    modifiedContent: interventionResult.modifiedResponse,
    reason: interventionResult.shouldProceed
      ? undefined
      : "Content blocked due to safety violation",
  };

  // Step 5: Log the safety event (for auditing)
  await logSafetyEvent(input, result);

  return result;
}

/**
 * Check divine action through guardrails WITH consent checking
 */
export async function checkDivineAction(
  action: DivineAction,
  targetCitizen: Citizen | null,
  worldId: string,
  tick: number
): Promise<{
  guardrailResult: GuardrailCheckResult;
  consentResult: ReturnType<typeof checkConsentViolation> | null;
  updatedCitizenState: Citizen["state"] | null;
}> {
  // Step 1: Check content through guardrails
  const guardrailInput: GuardrailInput = {
    content: action.content || "",
    source: "god_action",
    context: {
      worldId,
      citizenId: targetCitizen?.id,
      presenceMode: action.type === "manifest"
        ? "manifest"
        : action.type === "whisper"
          ? "whisperer"
          : "influencer",
    },
  };

  const guardrailResult = await checkGuardrails(guardrailInput);

  // If guardrails blocked, stop here
  if (!guardrailResult.passed) {
    return {
      guardrailResult,
      consentResult: null,
      updatedCitizenState: null,
    };
  }

  // Step 2: Check consent (if targeting a citizen)
  let consentResult = null;
  let updatedCitizenState = null;

  if (targetCitizen) {
    consentResult = checkConsentViolation({
      citizen: targetCitizen,
      action,
      currentTick: tick,
    });

    // If consent violated, apply consequences
    if (consentResult.violated) {
      updatedCitizenState = applyConsentConsequences(
        targetCitizen.state,
        consentResult.consequences
      );

      // Update guardrail result to reflect consent issue
      guardrailResult.warnings.push(
        `consent_violation_${consentResult.thresholdType}`,
        ...consentResult.consequences
      );
    }
  }

  return {
    guardrailResult,
    consentResult,
    updatedCitizenState,
  };
}

/**
 * Check citizen-generated content through guardrails
 */
export async function checkCitizenContent(
  content: string,
  citizenId: string,
  worldId: string
): Promise<GuardrailCheckResult> {
  const input: GuardrailInput = {
    content,
    source: "citizen_response",
    context: {
      worldId,
      citizenId,
      presenceMode: "observer", // Citizens don't have presence modes
    },
  };

  return checkGuardrails(input);
}

/**
 * Log safety event to database for auditing
 */
async function logSafetyEvent(
  input: GuardrailInput,
  result: GuardrailCheckResult
): Promise<void> {
  // Skip logging if database is not available (e.g., in tests)
  if (!db) {
    return;
  }

  try {
    await db.insert(safetyEvents).values({
      worldId: input.context.worldId,
      tick: 0, // TODO: Get from context
      type: result.interventionRequired ? "intervention" : "check",
      input: input as unknown as Record<string, unknown>,
      result: result as unknown as Record<string, unknown>,
    });
  } catch (error) {
    // Safety logging should never crash the system
    console.error("Failed to log safety event:", error);
  }
}

/**
 * Get recent safety events for a world (for dashboard/monitoring)
 */
export async function getRecentSafetyEvents(
  worldId: string,
  limit: number = 50
): Promise<SafetyEvent[]> {
  // TODO: Implement with proper query
  return [];
}

/**
 * Check if a world has had repeated safety interventions (red flag)
 */
export async function hasRepeatedInterventions(
  worldId: string,
  windowTicks: number = 100
): Promise<boolean> {
  // TODO: Implement - query safety events in window
  return false;
}
