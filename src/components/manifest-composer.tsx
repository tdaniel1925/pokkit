"use client";

/**
 * Manifest Composer Component - Phase 3
 * UI for creating divine revelations/manifestations
 */

import { useState } from "react";
import type {
  RevelationType,
  ManifestIntensity,
  ManifestReactionType,
} from "@/types/manifest";

interface ManifestComposerProps {
  worldId: string;
  currentTick: number;
  currentInstability: number;
  instabilityTrend: "stable" | "rising" | "falling" | "critical";
  cooldownUntilTick?: number;
  onManifest?: (result: ManifestResultSummary) => void;
}

interface ManifestResultSummary {
  success: boolean;
  type: RevelationType;
  affectedCount: number;
  dominantReaction: ManifestReactionType;
  newInstability: number;
}

const revelationTypes: {
  value: RevelationType;
  label: string;
  description: string;
}[] = [
  {
    value: "proclamation",
    label: "Proclamation",
    description: "Direct statement of truth or command",
  },
  {
    value: "sign",
    label: "Sign",
    description: "A miraculous event or omen",
  },
  {
    value: "visitation",
    label: "Visitation",
    description: "Personal appearance (described)",
  },
  {
    value: "prophecy",
    label: "Prophecy",
    description: "A prediction of the future",
  },
  {
    value: "judgment",
    label: "Judgment",
    description: "Moral pronouncement on society",
  },
  {
    value: "blessing",
    label: "Blessing",
    description: "Collective gift or blessing",
  },
  {
    value: "warning",
    label: "Warning",
    description: "Divine warning of consequences",
  },
];

const intensityLevels: {
  value: ManifestIntensity;
  label: string;
  impact: string;
  instabilityAdd: string;
}[] = [
  {
    value: "subtle",
    label: "Subtle",
    impact: "Easily dismissed, minor impact",
    instabilityAdd: "+5%",
  },
  {
    value: "notable",
    label: "Notable",
    impact: "Clear but deniable",
    instabilityAdd: "+15%",
  },
  {
    value: "undeniable",
    label: "Undeniable",
    impact: "Hard to ignore",
    instabilityAdd: "+30%",
  },
  {
    value: "overwhelming",
    label: "Overwhelming",
    impact: "Society-shaking",
    instabilityAdd: "+50%",
  },
];

const targetAudiences = [
  { value: "all", label: "All Citizens" },
  { value: "believers", label: "Believers Only" },
  { value: "skeptics", label: "Skeptics Only" },
  { value: "suffering", label: "Those Suffering" },
];

export function ManifestComposer({
  worldId,
  currentTick,
  currentInstability,
  instabilityTrend,
  cooldownUntilTick,
  onManifest,
}: ManifestComposerProps) {
  const [type, setType] = useState<RevelationType>("proclamation");
  const [intensity, setIntensity] = useState<ManifestIntensity>("notable");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ManifestResultSummary | null>(
    null
  );

  const isOnCooldown =
    cooldownUntilTick !== undefined && currentTick < cooldownUntilTick;
  const cooldownRemaining = isOnCooldown
    ? cooldownUntilTick! - currentTick
    : 0;

  const handleSubmit = async () => {
    if (content.length < 10) {
      setError("Revelation content must be at least 10 characters");
      return;
    }

    if (isOnCooldown) {
      setError(`Cannot manifest yet. ${cooldownRemaining} ticks remaining.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/world/${worldId}/manifest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          intensity,
          content,
          targetAudience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create manifestation");
        return;
      }

      const result: ManifestResultSummary = {
        success: true,
        type,
        affectedCount: data.manifestation.affectedCitizenCount,
        dominantReaction: data.manifestation.dominantReaction,
        newInstability: data.newInstability,
      };

      setLastResult(result);
      setContent("");
      onManifest?.(result);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInstabilityColor = (level: number): string => {
    if (level >= 0.8) return "text-red-600";
    if (level >= 0.5) return "text-orange-500";
    if (level >= 0.3) return "text-yellow-500";
    return "text-green-500";
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case "rising":
        return "\u2191";
      case "falling":
        return "\u2193";
      case "critical":
        return "\u26A0";
      default:
        return "\u2192";
    }
  };

  return (
    <div className="bg-gradient-to-b from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-200">
          Divine Manifestation
        </h3>
        <div className="text-sm">
          <span className="text-gray-400">Instability: </span>
          <span className={getInstabilityColor(currentInstability)}>
            {Math.round(currentInstability * 100)}%
          </span>
          <span className="ml-1">{getTrendIcon(instabilityTrend)}</span>
        </div>
      </div>

      {isOnCooldown && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-md">
          <p className="text-yellow-200 text-sm">
            Manifestation on cooldown. {cooldownRemaining} ticks remaining.
          </p>
          <p className="text-yellow-200/70 text-xs mt-1">
            Divine presence requires time to stabilize between revelations.
          </p>
        </div>
      )}

      {currentInstability >= 0.8 && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-md">
          <p className="text-red-200 text-sm font-medium">
            Critical Instability Warning
          </p>
          <p className="text-red-200/70 text-xs mt-1">
            Society is under severe spiritual strain. Further manifestations may
            cause lasting damage.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Revelation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Revelation Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {revelationTypes.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setType(rt.value)}
                className={`p-2 text-left rounded-md border transition-colors ${
                  type === rt.value
                    ? "bg-green-600/30 border-green-400 text-green-200"
                    : "bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="font-medium text-sm">{rt.label}</div>
                <div className="text-xs opacity-70">{rt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Intensity
          </label>
          <div className="space-y-2">
            {intensityLevels.map((il) => (
              <button
                key={il.value}
                onClick={() => setIntensity(il.value)}
                className={`w-full p-2 text-left rounded-md border transition-colors flex justify-between items-center ${
                  intensity === il.value
                    ? "bg-green-600/30 border-green-400 text-green-200"
                    : "bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div>
                  <span className="font-medium">{il.label}</span>
                  <span className="text-xs ml-2 opacity-70">{il.impact}</span>
                </div>
                <span
                  className={`text-xs ${
                    il.value === "overwhelming"
                      ? "text-red-400"
                      : il.value === "undeniable"
                        ? "text-orange-400"
                        : "text-yellow-400"
                  }`}
                >
                  {il.instabilityAdd}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Audience
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full p-2 bg-gray-800/50 border border-gray-600 rounded-md text-gray-200"
          >
            {targetAudiences.map((ta) => (
              <option key={ta.value} value={ta.value}>
                {ta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Revelation Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Speak your divine message..."
            className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 min-h-[100px]"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {content.length}/500
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-md">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Last Result */}
        {lastResult && (
          <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-md">
            <p className="text-green-200 text-sm font-medium">
              Manifestation Complete
            </p>
            <div className="text-green-200/70 text-xs mt-1 space-y-1">
              <p>Affected {lastResult.affectedCount} citizens</p>
              <p>Dominant reaction: {lastResult.dominantReaction}</p>
              <p>
                New instability: {Math.round(lastResult.newInstability * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting || isOnCooldown || content.length < 10
          }
          className={`w-full py-3 rounded-md font-medium transition-colors ${
            isSubmitting || isOnCooldown || content.length < 10
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-500"
          }`}
        >
          {isSubmitting
            ? "Manifesting..."
            : isOnCooldown
              ? `Cooldown (${cooldownRemaining} ticks)`
              : "Manifest Divine Presence"}
        </button>
      </div>
    </div>
  );
}
