"use client";

/**
 * World Config Editor - Creator Tools
 * Allows editing world configuration parameters
 */

import { useState } from "react";
import type { WorldConfig } from "@/types/world";

interface WorldConfigEditorProps {
  worldId: string;
  initialConfig: WorldConfig;
  onSave?: (config: WorldConfig) => void;
  onCancel?: () => void;
}

interface ConfigSlider {
  key: keyof WorldConfig;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}

const configSliders: ConfigSlider[] = [
  {
    key: "culturalEntropy",
    label: "Cultural Entropy",
    description: "How diverse and chaotic the society is (0 = homogeneous, 1 = chaotic)",
    min: 0,
    max: 1,
    step: 0.1,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: "beliefPlasticity",
    label: "Belief Plasticity",
    description: "How easily citizens change their beliefs",
    min: 0,
    max: 1,
    step: 0.1,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: "crisisFrequency",
    label: "Crisis Frequency",
    description: "How often crises occur in the world",
    min: 0,
    max: 1,
    step: 0.1,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: "authoritySkepticismIndex",
    label: "Authority Skepticism",
    description: "How skeptical citizens are of authority/divine",
    min: 0,
    max: 1,
    step: 0.1,
    format: (v) => `${Math.round(v * 100)}%`,
  },
];

export function WorldConfigEditor({
  worldId,
  initialConfig,
  onSave,
  onCancel,
}: WorldConfigEditorProps) {
  const [config, setConfig] = useState<WorldConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSliderChange = (key: keyof WorldConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleNameChange = (name: string) => {
    setConfig((prev) => ({ ...prev, name }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/world/${worldId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save configuration");
        return;
      }

      setHasChanges(false);
      onSave?.(config);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setHasChanges(false);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">
          World Configuration
        </h3>
        {hasChanges && (
          <span className="text-sm text-yellow-400">Unsaved changes</span>
        )}
      </div>

      <div className="space-y-6">
        {/* World Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            World Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-md text-gray-200"
            maxLength={100}
          />
        </div>

        {/* Population Size (read-only after creation) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Population Size
          </label>
          <div className="p-2 bg-gray-700/30 border border-gray-600 rounded-md text-gray-400">
            {config.populationSize} citizens
            <span className="text-xs ml-2">(Cannot be changed)</span>
          </div>
        </div>

        {/* Configurable Sliders */}
        {configSliders.map((slider) => (
          <div key={slider.key}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">
                {slider.label}
              </label>
              <span className="text-sm text-purple-400">
                {slider.format(config[slider.key] as number)}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={config[slider.key] as number}
              onChange={(e) =>
                handleSliderChange(slider.key, parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">{slider.description}</p>
          </div>
        ))}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-md">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${
              isSaving || !hasChanges
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-500"
            }`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
