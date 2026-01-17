"use client";

import type { Citizen } from "@/types/citizen";
import { ARCHETYPE_DESCRIPTIONS } from "@/lib/ai/citizen/personality";
import {
  Heart,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface CitizenCardProps {
  citizen: Citizen;
  onClick?: () => void;
  isSelected?: boolean;
}

export function CitizenCard({ citizen, onClick, isSelected }: CitizenCardProps) {
  const { name, attributes, state } = citizen;

  const getMoodIcon = () => {
    if (state.mood > 0.3) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (state.mood < -0.3) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-neutral-500" />;
  };

  const getTrustColor = () => {
    if (state.trustInGod > 0.3) return "text-divine-400";
    if (state.trustInGod < -0.3) return "text-red-400";
    return "text-neutral-400";
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-neutral-900/50 rounded-lg p-4 border transition-all cursor-pointer
        ${isSelected ? "border-divine-500 divine-glow" : "border-neutral-800 hover:border-neutral-700"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{name}</h3>
        {getMoodIcon()}
      </div>

      {/* Archetype */}
      <div className="mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-300 capitalize">
          {attributes.personalityArchetype}
        </span>
      </div>

      {/* State indicators */}
      <div className="space-y-2 text-sm">
        <StateBar
          icon={<Heart className="w-3 h-3" />}
          label="Hope"
          value={state.hope}
          color="green"
        />
        <StateBar
          icon={<Zap className="w-3 h-3" />}
          label="Stress"
          value={state.stress}
          color="amber"
          inverted
        />
        <StateBar
          icon={<Brain className="w-3 h-3" />}
          label="Dissonance"
          value={state.cognitiveDissonance}
          color="green"
          inverted
        />
      </div>

      {/* Divine trust */}
      <div className="mt-3 pt-3 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Divine Trust
          </span>
          <span className={`text-xs font-medium ${getTrustColor()}`}>
            {state.trustInGod > 0.5
              ? "Faithful"
              : state.trustInGod > 0
                ? "Curious"
                : state.trustInGod > -0.5
                  ? "Skeptical"
                  : "Distrustful"}
          </span>
        </div>
      </div>
    </div>
  );
}

function StateBar({
  icon,
  label,
  value,
  color,
  inverted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "green" | "amber" | "emerald" | "blue";
  inverted?: boolean;
}) {
  const percentage = Math.abs(value) * 100;
  const displayValue = inverted ? value : value;

  const colorClasses = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-500">{icon}</span>
      <span className="text-xs text-neutral-400 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-neutral-500 w-8 text-right">
        {(displayValue * 100).toFixed(0)}%
      </span>
    </div>
  );
}

interface CitizenListProps {
  citizens: Citizen[];
  selectedId?: string;
  onSelect?: (citizen: Citizen) => void;
}

export function CitizenList({ citizens, selectedId, onSelect }: CitizenListProps) {
  if (citizens.length === 0) {
    return (
      <div className="text-center text-neutral-500 py-8">
        No citizens yet. The world awaits.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {citizens.map((citizen) => (
        <CitizenCard
          key={citizen.id}
          citizen={citizen}
          isSelected={citizen.id === selectedId}
          onClick={() => onSelect?.(citizen)}
        />
      ))}
    </div>
  );
}
