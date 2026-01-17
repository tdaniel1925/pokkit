"use client";

/**
 * World List Component - Multi-World Support
 * Displays user's worlds with stats and navigation
 */

import { useState, useEffect } from "react";
import Link from "next/link";

interface WorldSummary {
  id: string;
  name: string;
  config: {
    name: string;
    populationSize: number;
    culturalEntropy: number;
    beliefPlasticity: number;
    crisisFrequency: number;
    authoritySkepticismIndex: number;
  };
  tick: number;
  status: "active" | "paused" | "ended";
  presenceMode: string;
  instability: number;
  instabilityTrend: string;
  manifestCount: number;
  citizenCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WorldListProps {
  onWorldSelect?: (worldId: string) => void;
}

export function WorldList({ onWorldSelect }: WorldListProps) {
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/world");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load worlds");
        return;
      }

      setWorlds(data.worlds);
    } catch (err) {
      setError("Network error loading worlds");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "paused":
        return "text-yellow-400";
      case "ended":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getInstabilityColor = (level: number): string => {
    if (level >= 0.8) return "text-red-500";
    if (level >= 0.5) return "text-orange-500";
    if (level >= 0.3) return "text-yellow-500";
    return "text-green-500";
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case "rising":
        return "\u2191";
      case "falling":
        return "\u2193";
      case "critical":
        return "\u26A0";
      default:
        return "-";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading worlds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-md">
        <p className="text-red-200">{error}</p>
        <button
          onClick={fetchWorlds}
          className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (worlds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🌍</div>
        <h3 className="text-xl font-medium text-gray-200 mb-2">No Worlds Yet</h3>
        <p className="text-gray-400 mb-6">
          Create your first world to begin your divine journey.
        </p>
        <Link
          href="/world/new"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
        >
          Create World
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Your Worlds</h2>
        <Link
          href="/world/new"
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-500 transition-colors"
        >
          + New World
        </Link>
      </div>

      <div className="grid gap-4">
        {worlds.map((world) => (
          <Link
            key={world.id}
            href={`/world/${world.id}`}
            onClick={() => onWorldSelect?.(world.id)}
            className="block p-4 bg-surface/50 border border-green-900/50 rounded-lg hover:border-green-500/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-100">
                  {world.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {world.citizenCount} citizens · Tick {world.tick}
                </p>
              </div>
              <span
                className={`text-sm font-medium ${getStatusColor(world.status)}`}
              >
                {world.status.charAt(0).toUpperCase() + world.status.slice(1)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Mode</span>
                <p className="text-gray-300 capitalize">{world.presenceMode}</p>
              </div>
              <div>
                <span className="text-gray-500">Instability</span>
                <p className={getInstabilityColor(world.instability)}>
                  {Math.round(world.instability * 100)}%{" "}
                  {getTrendIcon(world.instabilityTrend)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Manifestations</span>
                <p className="text-gray-300">{world.manifestCount}</p>
              </div>
              <div>
                <span className="text-gray-500">Updated</span>
                <p className="text-gray-300">{formatDate(world.updatedAt)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
