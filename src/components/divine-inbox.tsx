"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Inbox,
  Eye,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import type { DivineInboxItem, InboxItemCategory, InboxSummary } from "@/types/divine";

interface DivineInboxProps {
  items: Array<
    DivineInboxItem & {
      citizenName: string;
      categoryLabel: string;
      suggestedTone: string;
    }
  >;
  summary: InboxSummary;
  onMarkSeen: (itemIds: string[]) => void;
  onRespond: (item: DivineInboxItem) => void;
  onMarkAllSeen: () => void;
}

const CATEGORY_CONFIG: Record<
  InboxItemCategory,
  { emoji: string; color: string; bgColor: string }
> = {
  prayer: { emoji: "🙏", color: "text-green-400", bgColor: "bg-green-900/30" },
  question: { emoji: "❓", color: "text-blue-400", bgColor: "bg-blue-900/30" },
  accusation: { emoji: "😠", color: "text-red-400", bgColor: "bg-red-900/30" },
  praise: { emoji: "✨", color: "text-yellow-400", bgColor: "bg-yellow-900/30" },
  crisis_call: { emoji: "🆘", color: "text-red-500", bgColor: "bg-red-900/50" },
  doubt: { emoji: "🤔", color: "text-neutral-400", bgColor: "bg-neutral-800/50" },
  testimony: { emoji: "📜", color: "text-amber-400", bgColor: "bg-amber-900/30" },
};

function RelevanceBar({ score }: { score: number }) {
  const width = Math.round(score * 100);
  const color =
    score > 0.7
      ? "bg-red-500"
      : score > 0.4
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function InboxItem({
  item,
  onMarkSeen,
  onRespond,
}: {
  item: DivineInboxProps["items"][0];
  onMarkSeen: (id: string) => void;
  onRespond: (item: DivineInboxItem) => void;
}) {
  const config = CATEGORY_CONFIG[item.category];
  const isUnread = !item.seenAt;
  const hasResponded = !!item.respondedAt;

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all
        ${isUnread ? "border-green-500/50 bg-green-900/10" : "border-neutral-700 bg-neutral-800/50"}
        ${item.category === "crisis_call" ? "border-red-500/50 animate-pulse" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}
          >
            {config.emoji} {item.categoryLabel}
          </span>
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
          {hasResponded && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <RelevanceBar score={item.relevanceScore} />
          <span>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Citizen info */}
      <div className="text-sm text-neutral-400 mb-2">
        <span className="font-medium text-neutral-300">{item.citizenName}</span>
        <span className="mx-2">·</span>
        <span>
          Trust: {Math.round(item.citizenTrustInGod * 100)}% | Stress:{" "}
          {Math.round(item.citizenStress * 100)}%
        </span>
      </div>

      {/* Content */}
      <p className="text-neutral-200 mb-3">{item.fullContent}</p>

      {/* Surface reasons */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(item.surfaceReasons as string[]).map((reason, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-neutral-700/50 rounded text-xs text-neutral-400"
          >
            {reason.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isUnread && (
          <button
            onClick={() => onMarkSeen(item.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors"
          >
            <Eye className="w-4 h-4" />
            Mark seen
          </button>
        )}
        {!hasResponded && (
          <button
            onClick={() => onRespond(item)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Respond ({item.suggestedTone})
          </button>
        )}
      </div>
    </div>
  );
}

export function DivineInbox({
  items,
  summary,
  onMarkSeen,
  onRespond,
  onMarkAllSeen,
}: DivineInboxProps) {
  const [filter, setFilter] = useState<InboxItemCategory | "all">("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (showUnreadOnly && item.seenAt) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-green-400" />
          <h2 className="font-semibold text-lg">Divine Inbox</h2>
          {summary.unread > 0 && (
            <span className="px-2 py-0.5 bg-green-600 rounded-full text-xs font-medium">
              {summary.unread} new
            </span>
          )}
        </div>
        {summary.unread > 0 && (
          <button
            onClick={onMarkAllSeen}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Mark all seen
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-neutral-700 bg-neutral-800/50">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-neutral-200">
              {summary.total}
            </div>
            <div className="text-neutral-500">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {summary.unread}
            </div>
            <div className="text-neutral-500">Unread</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {summary.byCategory.crisis_call || 0}
            </div>
            <div className="text-neutral-500">Crisis</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {summary.byCategory.prayer || 0}
            </div>
            <div className="text-neutral-500">Prayers</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-neutral-700 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as InboxItemCategory | "all")
            }
            className="bg-neutral-700 border-none rounded px-2 py-1 text-sm"
          >
            <option value="all">All categories</option>
            <option value="crisis_call">🆘 Crisis Calls</option>
            <option value="prayer">🙏 Prayers</option>
            <option value="question">❓ Questions</option>
            <option value="accusation">😠 Accusations</option>
            <option value="praise">✨ Praise</option>
            <option value="doubt">🤔 Doubt</option>
            <option value="testimony">📜 Testimony</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded border-neutral-600"
          />
          Unread only
        </label>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages match your filters</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <InboxItem
              key={item.id}
              item={item}
              onMarkSeen={(id) => onMarkSeen([id])}
              onRespond={onRespond}
            />
          ))
        )}
      </div>

      {/* Crisis alert */}
      {summary.byCategory.crisis_call > 0 && (
        <div className="p-3 bg-red-900/30 border-t border-red-500/50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-300">
            {summary.byCategory.crisis_call} citizen(s) need urgent attention
          </span>
        </div>
      )}
    </div>
  );
}
