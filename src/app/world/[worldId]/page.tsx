"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import type { WorldState, WorldFeedItem, PresenceMode } from "@/types/world";
import type { Citizen } from "@/types/citizen";
import { WorldFeed } from "@/components/world-feed";
import { CitizenList } from "@/components/citizen-card";
import { PresencePanel } from "@/components/presence-panel";
import { WhisperComposer } from "@/components/whisper-composer";
import { ManifestComposer } from "@/components/manifest-composer";
import { ArrowLeft, Users, Activity, RefreshCw, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WorldViewPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;

  const [world, setWorld] = useState<WorldState | null>(null);
  const [feedItems, setFeedItems] = useState<WorldFeedItem[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [presenceMode, setPresenceMode] = useState<PresenceMode>("observer");
  const [activeTab, setActiveTab] = useState<"feed" | "citizens">("feed");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch world data
  const fetchWorldData = useCallback(async () => {
    try {
      const response = await fetch(`/api/world/${worldId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load world");
        return;
      }

      setWorld(data.world);
      setCitizens(data.citizens || []);
      setFeedItems(data.feedItems || []);
      setError(null);
    } catch (err) {
      setError("Network error loading world");
      console.error("Failed to load world:", err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId]);

  // Initial load
  useEffect(() => {
    fetchWorldData();
  }, [fetchWorldData]);

  // Handle tick advance
  const handleAdvanceTick = async () => {
    if (isAdvancing || !world) return;

    setIsAdvancing(true);
    try {
      const response = await fetch(`/api/world/${worldId}/tick`, {
        method: "POST",
      });

      if (response.ok) {
        // Refresh world data after tick
        await fetchWorldData();
      } else {
        const data = await response.json();
        console.error("Failed to advance tick:", data.error);
      }
    } catch (err) {
      console.error("Error advancing tick:", err);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Handle whisper sent
  const handleWhisperSent = () => {
    // Refresh data to show whisper effects
    fetchWorldData();
  };

  // Handle manifest
  const handleManifest = () => {
    // Refresh data to show manifestation effects
    fetchWorldData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="flex items-center gap-3 text-green-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading world...</span>
        </div>
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "World not found"}</p>
          <Link
            href="/dashboard"
            className="text-green-400 hover:text-green-300 underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Empty universe state - no citizens yet
  if (citizens.length === 0 && world.tick === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-light text-white">
            The Void Awaits
          </h1>
          <p className="text-xl md:text-2xl text-white/70 leading-relaxed">
            Your universe exists, but it is empty.
            <br />
            No life stirs. No thoughts form.
            <br />
            Only potential.
          </p>
          <div className="pt-8 space-y-4">
            <button
              onClick={() => router.push(`/world/${worldId}/configure`)}
              className="flex items-center justify-center gap-3 mx-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-lg font-medium rounded-lg transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Begin Creation
            </button>
            <Link
              href="/dashboard"
              className="block text-white/50 hover:text-white/70 text-sm transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-dark">
      {/* Header */}
      <header className="bg-surface/80 border-b border-green-900/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-medium text-white">
                {world.config.name}
              </h1>
              <p className="text-sm text-green-400/70">
                Tick {world.tick} · {citizens.length} citizens · {world.status}
              </p>
            </div>
          </div>
          <button
            onClick={handleAdvanceTick}
            disabled={isAdvancing}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
          >
            {isAdvancing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isAdvancing ? "Advancing..." : "Advance Tick"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left panel - Feed/Citizens */}
        <div className="flex-1 flex flex-col border-r border-green-900/30">
          {/* Tabs */}
          <div className="flex border-b border-green-900/30">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "feed"
                  ? "text-green-400 border-b-2 border-green-500"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              World Feed
            </button>
            <button
              onClick={() => setActiveTab("citizens")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "citizens"
                  ? "text-green-400 border-b-2 border-green-500"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Citizens ({citizens.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "feed" ? (
              <WorldFeed items={feedItems} isLoading={false} />
            ) : (
              <div className="p-4 overflow-y-auto h-full">
                <CitizenList
                  citizens={citizens}
                  selectedId={selectedCitizen?.id}
                  onSelect={setSelectedCitizen}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Presence controls */}
        <div className="w-96 p-4 bg-surface overflow-y-auto">
          <PresencePanel
            world={world}
            selectedCitizen={selectedCitizen}
            currentMode={presenceMode}
            onModeChange={setPresenceMode}
          />

          {/* Mode-specific composer */}
          <div className="mt-4">
            {presenceMode === "whisperer" && selectedCitizen && (
              <WhisperComposer
                worldId={worldId}
                citizen={selectedCitizen}
                onSend={async (content, tone) => {
                  await fetch(`/api/world/${worldId}/whisper`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      citizenId: selectedCitizen.id,
                      content,
                      tone,
                    }),
                  });
                  fetchWorldData();
                }}
              />
            )}

            {presenceMode === "whisperer" && !selectedCitizen && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  Select a citizen from the Citizens tab to whisper to them.
                </p>
              </div>
            )}

            {presenceMode === "manifest" && (
              <ManifestComposer
                worldId={worldId}
                currentTick={world.tick}
                currentInstability={(world as any).instability || 0}
                instabilityTrend={(world as any).instabilityTrend || "stable"}
                onManifest={handleManifest}
              />
            )}

            {presenceMode === "observer" && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-200 text-sm">
                  You are observing silently. Citizens cannot see or sense your presence.
                </p>
                <p className="text-green-200/60 text-xs mt-2">
                  Click "Advance Tick" to progress the simulation and see what happens.
                </p>
              </div>
            )}

            {presenceMode === "influencer" && (
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  Influencer mode allows subtle environmental nudges. Select a citizen to bless or dim their presence.
                </p>
                {selectedCitizen && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={async () => {
                        await fetch(`/api/world/${worldId}/influence`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            citizenId: selectedCitizen.id,
                            action: "bless",
                            intensity: 0.5,
                          }),
                        });
                        fetchWorldData();
                      }}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 rounded text-sm text-white"
                    >
                      Bless {selectedCitizen.name}
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/world/${worldId}/influence`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            citizenId: selectedCitizen.id,
                            action: "dim",
                            intensity: 0.3,
                          }),
                        });
                        fetchWorldData();
                      }}
                      className="w-full py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white"
                    >
                      Dim {selectedCitizen.name}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
