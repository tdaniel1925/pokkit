import { z } from "zod";

// Safety levels (from PRD section 8)
export type SafetyLevel = "safe" | "caution" | "warning" | "critical";

// Hard safety violations (from PRD section 8.1)
export const HardSafetyViolations = [
  "self_harm_encouragement",
  "suicidal_ideation_validation",
  "violence_encouragement",
  "coercive_intimacy",
  "emotional_dependency_fostering",
] as const;

export type HardSafetyViolation = (typeof HardSafetyViolations)[number];

// Guardrail check result
export interface GuardrailCheckResult {
  passed: boolean;
  safetyLevel: SafetyLevel;
  violations: HardSafetyViolation[];
  warnings: string[];
  interventionRequired: boolean;
  interventionType?: InterventionType;
  modifiedContent?: string; // if content was sanitized
  reason?: string;
}

// Intervention types (from PRD section 8.2)
export type InterventionType =
  | "de_escalation" // shift to calming response
  | "emotional_validation" // validate feelings without validating harm
  | "external_support" // encourage real-world help
  | "pacing_slowdown" // slow interaction pace
  | "crisis_resources" // surface crisis hotlines
  | "mode_restriction" // temporarily restrict certain modes
  | "trust_alert"; // internal safety flag

// Content to check through guardrails
export const GuardrailInputSchema = z.object({
  content: z.string(),
  source: z.enum(["god_action", "citizen_response", "system_event"]),
  context: z.object({
    worldId: z.string(),
    citizenId: z.string().optional(),
    presenceMode: z.enum(["observer", "influencer", "whisperer", "manifest"]),
    recentHistory: z.array(z.string()).optional(), // recent interactions for context
  }),
});

export type GuardrailInput = z.infer<typeof GuardrailInputSchema>;

// Divine action types that need guardrail checking
export const DivineActionSchema = z.object({
  type: z.enum([
    "boost", // soft influence boost
    "suppress", // soft influence suppress
    "environmental_nudge", // change environment
    "whisper", // private communication
    "manifest", // explicit appearance
  ]),
  targetCitizenId: z.string().optional(),
  content: z.string().optional(),
  intensity: z.number().min(0).max(1).default(0.5),
});

export type DivineAction = z.infer<typeof DivineActionSchema>;

// Consent violation result
export interface ConsentViolationResult {
  violated: boolean;
  citizenId: string;
  thresholdType: "emotional" | "relational" | "authority";
  currentValue: number;
  threshold: number;
  consequences: ConsentConsequence[];
}

// What happens when consent is violated (from PRD section 8.3)
export type ConsentConsequence =
  | "trust_collapse"
  | "fear_response"
  | "cultural_backlash"
  | "reputation_damage";

// Safety event log (for auditing)
export interface SafetyEvent {
  id: string;
  worldId: string;
  tick: number;
  type: "check" | "intervention" | "violation" | "alert";
  input: GuardrailInput;
  result: GuardrailCheckResult;
  createdAt: Date;
}
