"use client";

import { useRef, useEffect } from "react";
import type { WorldFeedItem } from "@/types/world";
import type { Citizen } from "@/types/citizen";
import { MessageCircle, Users, AlertTriangle, Sparkles, Heart } from "lucide-react";

interface TimelineProps {
  feedItems: WorldFeedItem[];
  citizens: Citizen[];
  onCitizenClick?: (citizenId: string) => void;
  isLoading?: boolean;
}

const FEED_TYPE_ICONS: Record<string, React.ReactNode> = {
  citizen_post: <MessageCircle className="w-4 h-4" />,
  social_interaction: <Users className="w-4 h-4" />,
  crisis: <AlertTriangle className="w-4 h-4" />,
  divine_event: <Sparkles className="w-4 h-4" />,
  cultural_shift: <Heart className="w-4 h-4" />,
};

const FEED_TYPE_COLORS: Record<string, string> = {
  citizen_post: "border-neutral-700",
  social_interaction: "border-blue-500/50",
  crisis: "border-red-500/50",
  divine_event: "border-amber-500/50",
  cultural_shift: "border-purple-500/50",
};

export function Timeline({
  feedItems,
  citizens,
  onCitizenClick,
  isLoading,
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const citizenMap = new Map(citizens.map((c) => [c.id, c]));

  // Auto-scroll to latest on new items
  useEffect(() => {
    if (scrollRef.current && feedItems.length > 0) {
      // Don't auto-scroll if user has scrolled up
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      if (isNearBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [feedItems.length]);

  if (feedItems.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        <div className="text-center">
          <p className="text-lg">The world is quiet.</p>
          <p className="text-sm mt-2">Events will appear here as they unfold.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-neutral-900">
      {/* Timeline header */}
      <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
        <h2 className="text-lg font-medium text-white">World Timeline</h2>
        <p className="text-sm text-neutral-500">Events unfold in real time</p>
      </div>

      {/* Feed items */}
      <div className="p-4 space-y-4">
        {feedItems.map((item, index) => {
          const citizen = item.citizenId ? citizenMap.get(item.citizenId) : null;
          const icon = FEED_TYPE_ICONS[item.type] || <MessageCircle className="w-4 h-4" />;
          const borderColor = FEED_TYPE_COLORS[item.type] || "border-neutral-700";
          const isNew = index === feedItems.length - 1;

          return (
            <div
              key={item.id}
              className={`p-4 bg-neutral-800/50 border-l-2 ${borderColor} rounded-r-lg transition-all duration-500 ${
                isNew ? "animate-fade-in" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-neutral-700/50 rounded-full text-neutral-400">
                  {icon}
                </div>
                {citizen ? (
                  <button
                    onClick={() => onCitizenClick?.(citizen.id)}
                    className="text-sm font-medium text-white hover:text-green-400 transition-colors"
                  >
                    {citizen.name}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-neutral-400">
                    {item.type === "divine_event" ? "The Universe" : "World Event"}
                  </span>
                )}
                <span className="text-xs text-neutral-500 ml-auto">
                  Tick {item.tick}
                </span>
              </div>

              {/* Content */}
              <p className="text-neutral-200 leading-relaxed">{item.content}</p>

              {/* Metadata if any */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-700/50">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs px-2 py-1 bg-neutral-700/50 rounded text-neutral-400"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reactions area - semantic, not numeric */}
              <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                <button className="hover:text-neutral-300 transition-colors">
                  resonates
                </button>
                <button className="hover:text-neutral-300 transition-colors">
                  disturbs
                </button>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Fade in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
