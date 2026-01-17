"use client";

import { useEffect, useRef } from "react";
import type { WorldFeedItem } from "@/types/world";
import { User, Sparkles, AlertTriangle, MessageCircle } from "lucide-react";

interface WorldFeedProps {
  items: WorldFeedItem[];
  isLoading?: boolean;
}

export function WorldFeed({ items, isLoading }: WorldFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new items
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [items.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-neutral-500">Loading world feed...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <p>The world is quiet.</p>
          <p className="text-sm mt-2">Citizens will begin their lives soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      className="flex-1 overflow-y-auto space-y-3 p-4"
    >
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function FeedItem({ item }: { item: WorldFeedItem }) {
  const getIcon = () => {
    switch (item.type) {
      case "citizen_post":
        return <User className="w-4 h-4" />;
      case "divine_event":
        return <Sparkles className="w-4 h-4 text-divine-400" />;
      case "crisis":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "cultural_shift":
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getBorderColor = () => {
    switch (item.type) {
      case "divine_event":
        return "border-divine-500/30";
      case "crisis":
        return "border-amber-500/30";
      case "cultural_shift":
        return "border-blue-500/30";
      default:
        return "border-neutral-800";
    }
  };

  return (
    <div
      className={`feed-item bg-neutral-900/50 rounded-lg p-4 border ${getBorderColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-neutral-500">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-neutral-200">{item.content}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
            <span>Tick {item.tick}</span>
            <span>•</span>
            <span className="capitalize">{item.type.replace("_", " ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
