"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowLeft,
  Filter,
} from "lucide-react";

interface SafetyFlag {
  id: string;
  worldId: string;
  userId: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "self_harm" | "violence" | "coercion" | "abuse" | "other";
  context: {
    summary?: string;
    sourceType?: string;
  };
  sourceType: string;
  sourceId: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface SafetyEvent {
  id: string;
  worldId: string;
  tick: number;
  type: string;
  input: Record<string, unknown>;
  result: {
    passed: boolean;
    warnings?: string[];
  };
  createdAt: string;
}

const SEVERITY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string; label: string }
> = {
  low: {
    icon: <Info className="w-4 h-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    label: "Low",
  },
  medium: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    label: "Medium",
  },
  high: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-900/30",
    label: "High",
  },
  critical: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-400",
    bgColor: "bg-red-900/50",
    label: "Critical",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  self_harm: "Self-Harm Concern",
  violence: "Violence",
  coercion: "Coercion",
  abuse: "Abuse",
  other: "Other",
};

export default function SafetyLogPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const [flags, setFlags] = useState<SafetyFlag[]>([]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"flags" | "events">("flags");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch safety flags
        const flagsRes = await fetch(`/api/world/${worldId}/safety?type=flags`);
        if (flagsRes.ok) {
          const flagsData = await flagsRes.json();
          setFlags(flagsData.flags || []);
        }

        // Fetch safety events
        const eventsRes = await fetch(`/api/world/${worldId}/safety?type=events`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData.events || []);
        }

        setError(null);
      } catch (err) {
        setError("Failed to load safety data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [worldId]);

  // Filter flags by severity
  const filteredFlags =
    severityFilter === "all"
      ? flags
      : flags.filter((f) => f.severity === severityFilter);

  // Count by severity
  const severityCounts = {
    critical: flags.filter((f) => f.severity === "critical").length,
    high: flags.filter((f) => f.severity === "high").length,
    medium: flags.filter((f) => f.severity === "medium").length,
    low: flags.filter((f) => f.severity === "low").length,
  };

  const unresolvedCount = flags.filter((f) => !f.resolvedAt).length;

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/world/${worldId}`}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to World
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Shield className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">Safety Log</h1>
            {unresolvedCount > 0 && (
              <span className="px-2 py-1 bg-red-600 rounded text-sm font-medium">
                {unresolvedCount} unresolved
              </span>
            )}
          </div>
          <p className="text-neutral-400 mt-2">
            Monitor safety events and flags for this world
          </p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="text-3xl font-bold">{severityCounts.critical}</div>
          </div>
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">High</span>
            </div>
            <div className="text-3xl font-bold">{severityCounts.high}</div>
          </div>
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Medium</span>
            </div>
            <div className="text-3xl font-bold">{severityCounts.medium}</div>
          </div>
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Info className="w-5 h-5" />
              <span className="text-sm font-medium">Low</span>
            </div>
            <div className="text-3xl font-bold">{severityCounts.low}</div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setView("flags")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "flags"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Flags ({flags.length})
            </button>
            <button
              onClick={() => setView("events")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "events"
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Events ({events.length})
            </button>
          </div>

          {view === "flags" && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-neutral-500">
            Loading safety data...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : view === "flags" ? (
          <div className="space-y-4">
            {filteredFlags.length === 0 ? (
              <div className="text-center py-12 bg-neutral-800 rounded-lg border border-neutral-700">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-neutral-400">No safety flags to display</p>
                <p className="text-sm text-neutral-500 mt-1">
                  This is a good thing!
                </p>
              </div>
            ) : (
              filteredFlags.map((flag) => {
                const config = SEVERITY_CONFIG[flag.severity];
                return (
                  <div
                    key={flag.id}
                    className={`p-4 rounded-lg border ${
                      flag.resolvedAt
                        ? "border-neutral-700 bg-neutral-800/50 opacity-60"
                        : `border-${flag.severity === "critical" ? "red" : flag.severity === "high" ? "orange" : "neutral"}-500/50 bg-neutral-800`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`p-2 rounded ${config.bgColor} ${config.color}`}
                        >
                          {config.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {CATEGORY_LABELS[flag.category] || flag.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${config.bgColor} ${config.color}`}
                            >
                              {config.label}
                            </span>
                            {flag.resolvedAt && (
                              <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 mt-1">
                            Source: {flag.sourceType}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {formatDistanceToNow(new Date(flag.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {flag.context?.summary && (
                      <p className="mt-3 text-sm text-neutral-300 bg-neutral-700/50 p-3 rounded">
                        {flag.context.summary}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-center py-12 bg-neutral-800 rounded-lg border border-neutral-700">
                <Shield className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400">No safety events recorded</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-neutral-800 rounded-lg border border-neutral-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {event.result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <span className="font-medium">{event.type}</span>
                      <span className="text-neutral-500 mx-2">·</span>
                      <span className="text-sm text-neutral-400">
                        Tick {event.tick}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {formatDistanceToNow(new Date(event.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Crisis Resources Banner */}
        {severityCounts.critical > 0 && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-300">
                  Critical flags detected
                </h3>
                <p className="text-sm text-red-200/80 mt-1">
                  If you or someone you know is in crisis, please reach out for
                  support. Remember that this is a simulation, but real emotions
                  can arise during play.
                </p>
                <div className="mt-3 flex gap-3">
                  <a
                    href="https://988lifeline.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded transition-colors"
                  >
                    988 Suicide & Crisis Lifeline
                  </a>
                  <a
                    href="https://www.crisistextline.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 bg-red-600/50 hover:bg-red-600 rounded transition-colors"
                  >
                    Crisis Text Line
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
