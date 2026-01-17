"use client";

import { useState } from "react";
import type { PresenceMode, WorldState } from "@/types/world";
import type { Citizen } from "@/types/citizen";
import { Eye, Sparkles, MessageCircle, Sun, AlertCircle } from "lucide-react";

interface PresencePanelProps {
  world: WorldState;
  selectedCitizen?: Citizen | null;
  onModeChange?: (mode: PresenceMode) => void;
  currentMode: PresenceMode;
}

export function PresencePanel({
  world,
  selectedCitizen,
  onModeChange,
  currentMode,
}: PresencePanelProps) {
  const modes: { mode: PresenceMode; icon: React.ReactNode; label: string; available: boolean; description: string }[] = [
    {
      mode: "observer",
      icon: <Eye className="w-5 h-5" />,
      label: "Observer",
      available: true,
      description: "Watch without being seen. Read-only access.",
    },
    {
      mode: "influencer",
      icon: <Sparkles className="w-5 h-5" />,
      label: "Influencer",
      available: true,
      description: "Soft boosts and environmental nudges.",
    },
    {
      mode: "whisperer",
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Whisperer",
      available: true,
      description: "Private divine communications to individual citizens.",
    },
    {
      mode: "manifest",
      icon: <Sun className="w-5 h-5" />,
      label: "Manifest",
      available: true,
      description: "Reveal yourself with divine proclamations to all.",
    },
  ];

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
      <h3 className="font-medium text-white mb-4">Presence Mode</h3>

      {/* Mode selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {modes.map(({ mode, icon, label, available, description }) => (
          <button
            key={mode}
            onClick={() => available && onModeChange?.(mode)}
            disabled={!available}
            className={`
              relative flex items-center gap-2 p-3 rounded-lg border transition-all
              ${
                currentMode === mode
                  ? "bg-divine-500/20 border-divine-500 text-divine-300"
                  : available
                    ? "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                    : "bg-neutral-800/30 border-neutral-800 text-neutral-600 cursor-not-allowed"
              }
            `}
            title={description}
          >
            {icon}
            <span className="text-sm font-medium">{label}</span>
            {!available && (
              <span className="absolute top-1 right-1 text-[10px] text-neutral-600">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current mode description */}
      <div className="bg-neutral-800/30 rounded-lg p-3 mb-4">
        <p className="text-sm text-neutral-400">
          {modes.find((m) => m.mode === currentMode)?.description}
        </p>
      </div>

      {/* Selected citizen info */}
      {selectedCitizen && currentMode !== "observer" && (
        <div className="border-t border-neutral-800 pt-4">
          <h4 className="text-sm font-medium text-neutral-300 mb-2">
            Target: {selectedCitizen.name}
          </h4>
          <div className="space-y-2 text-sm">
            <ConsentIndicator
              label="Emotional Threshold"
              value={selectedCitizen.consent.emotionalConsent}
            />
            <ConsentIndicator
              label="Authority Resistance"
              value={selectedCitizen.consent.authorityResistanceCurve}
            />
          </div>
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Exceeding consent thresholds will damage trust and may cause lasting harm.
            </span>
          </div>
        </div>
      )}

      {/* World stability */}
      <div className="border-t border-neutral-800 pt-4 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">World Tick</span>
          <span className="text-neutral-200 font-mono">{world.tick}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-neutral-400">Status</span>
          <span className={`capitalize ${world.status === "active" ? "text-green-400" : "text-neutral-400"}`}>
            {world.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function ConsentIndicator({ label, value }: { label: string; value: number }) {
  const percentage = value * 100;
  const color =
    value > 0.7 ? "bg-green-500" : value > 0.4 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-neutral-500">{label}</span>
        <span className="text-neutral-400">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
