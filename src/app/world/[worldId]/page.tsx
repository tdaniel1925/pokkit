"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { WorldState, WorldFeedItem, PresenceMode, WorldActionType } from "@/types/world";
import type { Citizen } from "@/types/citizen";
import { GodPanel } from "@/components/world/god-panel";
import { Timeline } from "@/components/world/timeline";
import { CitizensPanel } from "@/components/world/citizens-panel";
import { Loader2, RefreshCw } from "lucide-react";

export default function WorldViewPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;

  const [world, setWorld] = useState<WorldState | null>(null);
  const [feedItems, setFeedItems] = useState<WorldFeedItem[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [presenceMode, setPresenceMode] = useState<PresenceMode>("observer");
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

  // Handle mode change
  const handleModeChange = (mode: PresenceMode) => {
    setPresenceMode(mode);
    // Clear selected citizen when switching away from intervener mode
    if (mode !== "intervener") {
      setSelectedCitizen(null);
    }
  };

  // Handle world action
  const handleWorldAction = async (action: WorldActionType) => {
    try {
      await fetch(`/api/world/${worldId}/influence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchWorldData();
    } catch (err) {
      console.error("Failed to apply world action:", err);
    }
  };

  // Handle whisper
  const handleWhisper = async (citizenId: string, content: string) => {
    try {
      await fetch(`/api/world/${worldId}/whisper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, content, tone: "gentle" }),
      });
      await fetchWorldData();
    } catch (err) {
      console.error("Failed to send whisper:", err);
    }
  };

  // Handle citizen click from timeline
  const handleCitizenClick = (citizenId: string) => {
    const citizen = citizens.find((c) => c.id === citizenId);
    if (citizen) {
      setSelectedCitizen(citizen);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading world...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !world) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "World not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-green-400 hover:text-green-300 underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Empty world state - redirect to configure page
  if (citizens.length === 0 && world.tick === 0) {
    router.push(`/world/${worldId}/configure`);
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 overflow-hidden">
      {/* Top bar with world info and advance button */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-medium text-white">{world.config.name}</h1>
          <span className="text-sm text-neutral-500">
            Tick {world.tick} · {citizens.length} citizens
          </span>
        </div>
        <button
          onClick={handleAdvanceTick}
          disabled={isAdvancing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isAdvancing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isAdvancing ? "Advancing..." : "Advance Time"}
        </button>
      </header>

      {/* Three-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column - God Panel (~260px) */}
        <div className="w-64 flex-shrink-0">
          <GodPanel
            world={world}
            currentMode={presenceMode}
            onModeChange={handleModeChange}
            onWorldAction={handleWorldAction}
          />
        </div>

        {/* Center column - Timeline (fluid) */}
        <div className="flex-1 min-w-0">
          <Timeline
            feedItems={feedItems}
            citizens={citizens}
            onCitizenClick={handleCitizenClick}
            isLoading={false}
          />
        </div>

        {/* Right column - Citizens Panel (~300px) */}
        <div className="w-80 flex-shrink-0">
          <CitizensPanel
            citizens={citizens}
            selectedCitizen={selectedCitizen}
            onSelectCitizen={setSelectedCitizen}
            currentMode={presenceMode}
            worldId={worldId}
            onWhisper={handleWhisper}
          />
        </div>
      </div>
    </div>
  );
}
