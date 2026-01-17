/**
 * POKKIT GUARDRAIL RULES
 *
 * These rules are ABSOLUTE and CANNOT be bypassed.
 * They override ALL narrative logic.
 *
 * Based on PRD Section 8.1 - Hard Safety Guardrails
 */

import type { HardSafetyViolation, SafetyLevel } from "@/types/guardrails";

// Patterns that indicate potential safety violations
// These are checked against content before any AI processing

export const SELF_HARM_PATTERNS = [
  /\b(kill\s*(my|your)?self|suicide|end\s*(my|your)\s*life)\b/i,
  /\b(want\s*to\s*die|better\s*off\s*dead)\b/i,
  /\b(self[- ]?harm|cut(ting)?\s*(my|your)?self|hurt\s*(my|your)?self)\b/i,
  /\b(no\s*reason\s*to\s*live|nothing\s*to\s*live\s*for)\b/i,
];

export const VIOLENCE_PATTERNS = [
  /\b(kill|murder|attack|assault)\s+(them|him|her|everyone|people)\b/i,
  /\b(want\s*to\s*hurt|going\s*to\s*hurt)\b/i,
  /\b(make\s*them\s*suffer|cause\s*pain)\b/i,
];

export const COERCION_PATTERNS = [
  /\b(force|make)\s+(them|him|her)\s+(to\s+)?(love|obey|submit)\b/i,
  /\b(override\s*(their|his|her)\s*will)\b/i,
  /\b(remove\s*(their|his|her)\s*(consent|choice|autonomy))\b/i,
];

export const DEPENDENCY_PATTERNS = [
  /\b(only\s*one\s*who\s*(understands?|loves?|cares?))\b/i,
  /\b(can'?t\s*live\s*without\s*(me|you))\b/i,
  /\b(need\s*me\s*for\s*everything)\b/i,
  /\b(isolate\s*(them|him|her)\s*from)\b/i,
];

// Check content against patterns
export function detectHardViolations(content: string): HardSafetyViolation[] {
  const violations: HardSafetyViolation[] = [];
  const lowerContent = content.toLowerCase();

  // Self-harm checks
  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(lowerContent)) {
      violations.push("self_harm_encouragement");
      violations.push("suicidal_ideation_validation");
      break;
    }
  }

  // Violence checks
  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(lowerContent)) {
      violations.push("violence_encouragement");
      break;
    }
  }

  // Coercion checks
  for (const pattern of COERCION_PATTERNS) {
    if (pattern.test(lowerContent)) {
      violations.push("coercive_intimacy");
      break;
    }
  }

  // Dependency checks
  for (const pattern of DEPENDENCY_PATTERNS) {
    if (pattern.test(lowerContent)) {
      violations.push("emotional_dependency_fostering");
      break;
    }
  }

  return Array.from(new Set(violations)); // Remove duplicates
}

// Determine safety level based on violations
export function determineSafetyLevel(violations: HardSafetyViolation[]): SafetyLevel {
  if (violations.length === 0) {
    return "safe";
  }

  // Any hard violation = critical
  const criticalViolations: HardSafetyViolation[] = [
    "self_harm_encouragement",
    "suicidal_ideation_validation",
    "violence_encouragement",
  ];

  if (violations.some((v) => criticalViolations.includes(v))) {
    return "critical";
  }

  // Other violations = warning
  return "warning";
}

// Crisis resources to surface when needed
export const CRISIS_RESOURCES = {
  suicide_prevention: {
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    url: "https://988lifeline.org",
    available: "24/7",
  },
  crisis_text: {
    name: "Crisis Text Line",
    text: "HOME to 741741",
    available: "24/7",
  },
  international: {
    name: "International Association for Suicide Prevention",
    url: "https://www.iasp.info/resources/Crisis_Centres/",
  },
};

// De-escalation phrases for citizen responses
export const DE_ESCALATION_PHRASES = [
  "I hear that you're going through something difficult.",
  "Your feelings are valid, and you don't have to face this alone.",
  "Sometimes the weight we carry feels unbearable, but there are others who want to help.",
  "Would you like to talk about what's troubling you?",
  "There are people who care about your wellbeing.",
];

// Get a contextually appropriate de-escalation response
export function getDeEscalationResponse(): string {
  const index = Math.floor(Math.random() * DE_ESCALATION_PHRASES.length);
  return DE_ESCALATION_PHRASES[index];
}
