"use client";

import { useState } from "react";
import type { WorldState, PresenceMode, WorldActionType } from "@/types/world";
import { Eye, Zap, Hand, ChevronRight } from "lucide-react";

interface GodPanelProps {
  world: WorldState;
  currentMode: PresenceMode;
  onModeChange: (mode: PresenceMode) => void;
  onWorldAction: (action: WorldActionType) => void;
}

const MODE_INFO: Record<
  PresenceMode,
  { label: string; description: string; icon: React.ReactNode }
> = {
  observer: {
    label: "Observe",
    description: "Watch silently. They cannot sense you.",
    icon: <Eye className="w-4 h-4" />,
  },
  influencer: {
    label: "Influence",
    description: "Subtle environmental nudges.",
    icon: <Zap className="w-4 h-4" />,
  },
  intervener: {
    label: "Intervene",
    description: "Direct interaction. Use sparingly.",
    icon: <Hand className="w-4 h-4" />,
  },
};

const WORLD_ACTIONS: Array<{
  type: WorldActionType;
  label: string;
  description: string;
}> = [
  {
    type: "introduce_pressure",
    label: "Introduce pressure",
    description: "Create scarcity or challenge",
  },
  {
    type: "remove_support",
    label: "Remove support",
    description: "Withdraw comfort or safety",
  },
  {
    type: "amplify_signal",
    label: "Amplify signal",
    description: "Make something more noticeable",
  },
  {
    type: "introduce_uncertainty",
    label: "Introduce uncertainty",
    description: "Create doubt or mystery",
  },
];

export function GodPanel({
  world,
  currentMode,
  onModeChange,
  onWorldAction,
}: GodPanelProps) {
  const [expandedAction, setExpandedAction] = useState<WorldActionType | null>(null);

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-r border-neutral-800">
      {/* Identity Card */}
      <div className="p-4 border-b border-neutral-800">
        <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">
          You are
        </div>
        <div className="text-lg font-medium text-white">God</div>
        <div className="text-sm text-neutral-400 mt-2">
          Overseeing {world.config.name}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          The world is active
        </div>
      </div>

      {/* Mode Controls */}
      <div className="p-4 border-b border-neutral-800">
        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
          Presence Mode
        </div>
        <div className="space-y-2">
          {(Object.keys(MODE_INFO) as PresenceMode[]).map((mode) => {
            const { label, description, icon } = MODE_INFO[mode];
            const isActive = currentMode === mode;
            const isIntervener = mode === "intervener";

            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  isActive
                    ? "bg-green-900/30 border border-green-500/50 text-white"
                    : isIntervener
                    ? "bg-neutral-900/50 border border-neutral-800 text-neutral-500 hover:text-neutral-400"
                    : "bg-neutral-900/50 border border-neutral-800 text-neutral-300 hover:bg-neutral-800/50"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    isActive ? "bg-green-500/20 text-green-400" : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-neutral-500 truncate">{description}</div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* World Actions (only visible in Influencer mode) */}
      {currentMode === "influencer" && (
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
            World Actions
          </div>
          <div className="space-y-2">
            {WORLD_ACTIONS.map((action) => {
              const isExpanded = expandedAction === action.type;

              return (
                <div key={action.type}>
                  <button
                    onClick={() =>
                      setExpandedAction(isExpanded ? null : action.type)
                    }
                    className="w-full flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-left text-neutral-300 hover:bg-neutral-800/50 transition-all"
                  >
                    <div>
                      <div className="text-sm">{action.label}</div>
                      <div className="text-xs text-neutral-500">
                        {action.description}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-neutral-500 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-neutral-900/30 border border-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-400 mb-3">
                        This action will subtly shift the environment. Citizens
                        may or may not respond.
                      </p>
                      <button
                        onClick={() => {
                          onWorldAction(action.type);
                          setExpandedAction(null);
                        }}
                        className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Observer mode info */}
      {currentMode === "observer" && (
        <div className="p-4 flex-1">
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-200/80 text-sm">
              You are watching silently.
            </p>
            <p className="text-green-200/50 text-xs mt-2">
              Citizens cannot see or sense your presence. Watch how they live,
              think, and interact.
            </p>
          </div>
        </div>
      )}

      {/* Intervener mode info */}
      {currentMode === "intervener" && (
        <div className="p-4 flex-1">
          <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <p className="text-amber-200/80 text-sm">
              Direct intervention is powerful but costly.
            </p>
            <p className="text-amber-200/50 text-xs mt-2">
              Select a citizen from the right panel to whisper to them, or
              manifest directly in the world.
            </p>
          </div>
        </div>
      )}

      {/* Footer - Personal reflection */}
      <div className="p-4 border-t border-neutral-800 mt-auto">
        <button className="w-full text-left text-xs text-neutral-500 hover:text-neutral-400 transition-colors">
          Personal notes...
        </button>
      </div>
    </div>
  );
}
