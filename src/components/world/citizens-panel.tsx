"use client";

import { useState } from "react";
import type { Citizen } from "@/types/citizen";
import type { PresenceMode } from "@/types/world";
import { User, MessageCircle, ChevronRight, Send } from "lucide-react";

interface CitizensPanelProps {
  citizens: Citizen[];
  selectedCitizen: Citizen | null;
  onSelectCitizen: (citizen: Citizen | null) => void;
  currentMode: PresenceMode;
  worldId: string;
  onWhisper?: (citizenId: string, content: string) => Promise<void>;
}

// Derive a narrative status from citizen state
function getCitizenStatus(citizen: Citizen): string {
  const state = citizen.state;

  // High stress
  if (state.stress > 0.7) return "troubled";

  // Low mood
  if (state.mood < -0.5) return "in despair";

  // High cognitive dissonance - internal conflict
  if (state.cognitiveDissonance > 0.7) return "conflicted";

  // High hope and good mood
  if (state.hope > 0.7 && state.mood > 0.3) return "hopeful";

  // Good mood overall
  if (state.mood > 0.5) return "at peace";

  // Low trust in peers - isolated
  if (state.trustInPeers < 0.3) return "isolated";

  // High trust in God - devoted
  if (state.trustInGod > 0.7) return "devoted";

  // Low trust in God - skeptical
  if (state.trustInGod < -0.3) return "skeptical";

  return "going about life";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "troubled":
    case "in despair":
      return "text-red-400";
    case "conflicted":
      return "text-amber-400";
    case "hopeful":
    case "at peace":
      return "text-green-400";
    case "devoted":
      return "text-purple-400";
    case "skeptical":
      return "text-orange-400";
    case "isolated":
      return "text-neutral-500";
    default:
      return "text-neutral-400";
  }
}

export function CitizensPanel({
  citizens,
  selectedCitizen,
  onSelectCitizen,
  currentMode,
  worldId,
  onWhisper,
}: CitizensPanelProps) {
  const [whisperContent, setWhisperContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendWhisper = async () => {
    if (!selectedCitizen || !whisperContent.trim() || !onWhisper) return;

    setIsSending(true);
    try {
      await onWhisper(selectedCitizen.id, whisperContent);
      setWhisperContent("");
    } finally {
      setIsSending(false);
    }
  };

  // Sort citizens by some notion of "notability" - trust in peers as proxy for social activity
  const sortedCitizens = [...citizens].sort((a, b) => {
    const aActivity = a.state.trustInPeers || 0;
    const bActivity = b.state.trustInPeers || 0;
    return bActivity - aActivity;
  });

  // Show only top 10 in the quick list
  const notableCitizens = sortedCitizens.slice(0, 10);

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-l border-neutral-800">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <h2 className="text-lg font-medium text-white">Citizens</h2>
        <p className="text-sm text-neutral-500">{citizens.length} souls</p>
      </div>

      {/* Selected citizen detail */}
      {selectedCitizen && (
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-white">
                {selectedCitizen.name}
              </h3>
              <p className={`text-sm ${getStatusColor(getCitizenStatus(selectedCitizen))}`}>
                {getCitizenStatus(selectedCitizen)}
              </p>
            </div>
            <button
              onClick={() => onSelectCitizen(null)}
              className="text-neutral-500 hover:text-neutral-300"
            >
              <ChevronRight className="w-5 h-5 rotate-90" />
            </button>
          </div>

          {/* Citizen attributes - narrative, not stats */}
          <div className="space-y-2 text-sm text-neutral-400">
            <p>
              A {selectedCitizen.attributes.personalityArchetype} by nature.
            </p>
            {selectedCitizen.attributes.emotionalSensitivity > 0.7 && (
              <p>Deeply sensitive to emotional influences.</p>
            )}
            {selectedCitizen.attributes.authorityTrustBias > 0.5 && (
              <p>Tends to trust authority figures.</p>
            )}
            {selectedCitizen.attributes.authorityTrustBias < -0.3 && (
              <p>Naturally skeptical of authority.</p>
            )}
            {selectedCitizen.attributes.curiosityAboutDivinity > 0.7 && (
              <p>Deeply curious about the divine.</p>
            )}
          </div>

          {/* Whisper interface (only in Intervener mode) */}
          {currentMode === "intervener" && (
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Whisper to {selectedCitizen.name}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={whisperContent}
                  onChange={(e) => setWhisperContent(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendWhisper()}
                  placeholder="A private message..."
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleSendWhisper}
                  disabled={!whisperContent.trim() || isSending}
                  className="p-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                They may interpret this however they choose.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Citizens list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-xs text-neutral-500 uppercase tracking-wider px-2 py-2">
            Notable Citizens
          </div>
          <div className="space-y-1">
            {notableCitizens.map((citizen) => {
              const status = getCitizenStatus(citizen);
              const isSelected = selectedCitizen?.id === citizen.id;

              return (
                <button
                  key={citizen.id}
                  onClick={() => onSelectCitizen(isSelected ? null : citizen)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-green-900/30 border border-green-500/50"
                      : "hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {citizen.name}
                    </div>
                    <div className={`text-xs ${getStatusColor(status)}`}>
                      {status}
                    </div>
                  </div>
                  {citizen.state.trustInPeers > 0.5 && (
                    <MessageCircle className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
              );
            })}
          </div>

          {citizens.length > 10 && (
            <div className="px-2 py-4 text-center">
              <button className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors">
                View all {citizens.length} citizens...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live conversations preview */}
      <div className="p-4 border-t border-neutral-800">
        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
          Live Conversations
        </div>
        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg">
          <p className="text-xs text-neutral-400 italic">
            Citizens are thinking and talking amongst themselves...
          </p>
        </div>
      </div>
    </div>
  );
}
