"use client";

import { useState } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import type { Citizen } from "@/types/citizen";
import type { WhisperTone } from "@/types/social";
import { recommendWhisperTone } from "@/lib/whisperer/utils";

interface WhisperComposerProps {
  citizen: Citizen;
  worldId: string;
  onSend: (content: string, tone: WhisperTone) => Promise<void>;
  disabled?: boolean;
}

const TONE_DESCRIPTIONS: Record<WhisperTone, { label: string; description: string; icon: string }> = {
  gentle: {
    label: "Gentle",
    description: "Soft, non-intrusive suggestion",
    icon: "🌸",
  },
  urgent: {
    label: "Urgent",
    description: "Time-sensitive, creates slight pressure",
    icon: "⚡",
  },
  questioning: {
    label: "Questioning",
    description: "Socratic, prompts reflection",
    icon: "❓",
  },
  comforting: {
    label: "Comforting",
    description: "Emotional support",
    icon: "💝",
  },
  warning: {
    label: "Warning",
    description: "Alert without command",
    icon: "⚠️",
  },
  mysterious: {
    label: "Mysterious",
    description: "Cryptic, provokes curiosity",
    icon: "🌙",
  },
};

export function WhisperComposer({
  citizen,
  worldId,
  onSend,
  disabled = false,
}: WhisperComposerProps) {
  const [content, setContent] = useState("");
  const [selectedTone, setSelectedTone] = useState<WhisperTone>("gentle");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tone recommendation
  const recommendation = recommendWhisperTone(citizen);

  const handleSend = async () => {
    if (!content.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      await onSend(content, selectedTone);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send whisper");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSend();
    }
  };

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-divine-400" />
          <span className="text-sm font-medium text-white">
            Whisper to {citizen.name}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          A private message only they will hear
        </p>
      </div>

      {/* Tone Selection */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-neutral-400">Select tone:</span>
          {selectedTone === recommendation.recommended && (
            <span className="text-xs text-divine-400">(Recommended)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TONE_DESCRIPTIONS) as WhisperTone[]).map((tone) => {
            const { label, icon } = TONE_DESCRIPTIONS[tone];
            const isSelected = selectedTone === tone;
            const isRecommended = tone === recommendation.recommended;

            return (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                disabled={disabled}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-200
                  ${
                    isSelected
                      ? "bg-divine-500/20 text-divine-300 border border-divine-500/50"
                      : "bg-neutral-800 text-neutral-400 border border-transparent hover:bg-neutral-700"
                  }
                  ${isRecommended && !isSelected ? "ring-1 ring-divine-500/30" : ""}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {TONE_DESCRIPTIONS[selectedTone].description}
        </p>
      </div>

      {/* Content Input */}
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your whisper..."
          disabled={disabled || isSending}
          rows={3}
          maxLength={500}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-divine-500/50 focus:border-divine-500/50 resize-none disabled:opacity-50"
        />

        {/* Character count */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-neutral-500">
            {content.length}/500 characters
          </span>
          <span className="text-xs text-neutral-600">⌘ + Enter to send</span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Recommendation hint */}
      {selectedTone !== recommendation.recommended && (
        <div className="px-4 pb-3">
          <p className="text-xs text-neutral-500">
            <span className="text-divine-400">Tip:</span> {recommendation.reasoning}
          </p>
        </div>
      )}

      {/* Send button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleSend}
          disabled={disabled || isSending || !content.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-divine-500 hover:bg-divine-600 disabled:bg-neutral-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Whisper</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default WhisperComposer;
