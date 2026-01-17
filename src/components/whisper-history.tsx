"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageCircle, CheckCircle2, HelpCircle, XCircle, AlertTriangle, Share2 } from "lucide-react";
import type { DivineWhisper, WhisperReception } from "@/types/social";

interface WhisperHistoryProps {
  whispers: DivineWhisper[];
  citizenNames: Map<string, string>;
}

const RECEPTION_CONFIG: Record<
  WhisperReception,
  { icon: React.ReactNode; label: string; color: string }
> = {
  accepted: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: "Accepted",
    color: "text-green-400",
  },
  questioned: {
    icon: <HelpCircle className="w-4 h-4" />,
    label: "Questioned",
    color: "text-yellow-400",
  },
  ignored: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Ignored",
    color: "text-neutral-400",
  },
  resisted: {
    icon: <XCircle className="w-4 h-4" />,
    label: "Resisted",
    color: "text-red-400",
  },
  misinterpreted: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Misinterpreted",
    color: "text-orange-400",
  },
  shared: {
    icon: <Share2 className="w-4 h-4" />,
    label: "Shared",
    color: "text-blue-400",
  },
};

const TONE_ICONS: Record<string, string> = {
  gentle: "🌸",
  urgent: "⚡",
  questioning: "❓",
  comforting: "💝",
  warning: "⚠️",
  mysterious: "🌙",
};

export function WhisperHistory({ whispers, citizenNames }: WhisperHistoryProps) {
  if (whispers.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No whispers sent yet</p>
        <p className="text-xs mt-1">
          Select a citizen and send your first divine message
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {whispers.map((whisper) => {
        const citizenName =
          citizenNames.get(whisper.targetCitizenId) || "Unknown";
        const reception = whisper.reception
          ? RECEPTION_CONFIG[whisper.reception]
          : null;

        return (
          <div
            key={whisper.id}
            className="bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {TONE_ICONS[whisper.tone] || "💬"}
                </span>
                <span className="text-sm text-white">{citizenName}</span>
                <span className="text-xs text-neutral-500">
                  • Tick {whisper.tick}
                </span>
              </div>
              {reception && (
                <div className={`flex items-center gap-1 ${reception.color}`}>
                  {reception.icon}
                  <span className="text-xs">{reception.label}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-3 py-2">
              <p className="text-sm text-neutral-300 italic">
                &ldquo;{whisper.content}&rdquo;
              </p>
            </div>

            {/* Response */}
            {whisper.citizenResponse && (
              <div className="px-3 py-2 bg-neutral-800/50 border-t border-neutral-800">
                <p className="text-xs text-neutral-400">{whisper.citizenResponse}</p>
              </div>
            )}

            {/* Impact indicators */}
            {(whisper.emotionalImpact !== undefined ||
              whisper.beliefImpact) && (
              <div className="px-3 py-2 bg-neutral-900/50 border-t border-neutral-800 flex items-center gap-4 text-xs">
                {whisper.emotionalImpact !== undefined && (
                  <span
                    className={
                      whisper.emotionalImpact > 0
                        ? "text-green-400"
                        : whisper.emotionalImpact < 0
                        ? "text-red-400"
                        : "text-neutral-400"
                    }
                  >
                    Emotional:{" "}
                    {whisper.emotionalImpact > 0 ? "+" : ""}
                    {(whisper.emotionalImpact * 100).toFixed(0)}%
                  </span>
                )}
                {whisper.beliefImpact && (
                  <span className="text-divine-400">
                    Belief shift: {whisper.beliefImpact.topic}
                  </span>
                )}
              </div>
            )}

            {/* Guardrail notes */}
            {whisper.guardrailNotes && (
              <div className="px-3 py-1.5 bg-yellow-500/10 border-t border-yellow-500/20 text-xs text-yellow-400">
                Note: {whisper.guardrailNotes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WhisperHistory;
