"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { WorldState, WorldFeedItem, PresenceMode } from "@/types/world";
import type { Citizen } from "@/types/citizen";
import { WorldFeed } from "@/components/world-feed";
import { CitizenList } from "@/components/citizen-card";
import { PresencePanel } from "@/components/presence-panel";
import { ArrowLeft, Users, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";

// Fixed timestamp for mock data to avoid hydration mismatch
const MOCK_DATE = new Date("2026-01-17T00:00:00Z");

// Mock data for development (will be replaced with API calls)
const mockWorld: WorldState = {
  id: "demo-world",
  userId: "user-1",
  config: {
    name: "Genesis",
    populationSize: 25,
    culturalEntropy: 0.5,
    beliefPlasticity: 0.5,
    crisisFrequency: 0.3,
    authoritySkepticismIndex: 0.5,
  },
  tick: 42,
  status: "active",
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
};

const mockFeedItems: WorldFeedItem[] = [
  {
    id: "1",
    worldId: "demo-world",
    tick: 40,
    type: "citizen_post",
    citizenId: "citizen-1",
    content: "I wonder if there is meaning beyond what we can see. The stars feel like they're watching.",
    createdAt: MOCK_DATE,
  },
  {
    id: "2",
    worldId: "demo-world",
    tick: 41,
    type: "cultural_shift",
    content: "A new movement emerges: citizens are questioning the nature of free will.",
    createdAt: MOCK_DATE,
  },
  {
    id: "3",
    worldId: "demo-world",
    tick: 42,
    type: "citizen_post",
    citizenId: "citizen-2",
    content: "Today I helped a stranger. It felt right, though I cannot explain why.",
    createdAt: MOCK_DATE,
  },
];

export default function WorldViewPage() {
  const params = useParams();
  const worldId = params.worldId as string;

  const [world, setWorld] = useState<WorldState>(mockWorld);
  const [feedItems, setFeedItems] = useState<WorldFeedItem[]>(mockFeedItems);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [presenceMode, setPresenceMode] = useState<PresenceMode>("observer");
  const [activeTab, setActiveTab] = useState<"feed" | "citizens">("feed");
  const [isLoading, setIsLoading] = useState(true);

  // Load world data
  useEffect(() => {
    async function loadWorld() {
      try {
        // TODO: Replace with actual API call
        // const res = await fetch(`/api/world/${worldId}`);
        // const data = await res.json();
        // setWorld(data.world);
        // setFeedItems(data.feedItems);
        // setCitizens(data.citizens);

        // For now, use mock data
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Failed to load world:", error);
        setIsLoading(false);
      }
    }
    loadWorld();
  }, [worldId]);

  // Simulation tick (auto-advance in observer mode)
  useEffect(() => {
    if (world.status !== "active" || presenceMode !== "observer") return;

    const interval = setInterval(() => {
      // TODO: Call API to advance simulation
      // This would trigger processSimulationTick on the backend
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [world.status, presenceMode]);

  const handleAdvanceTick = async () => {
    // TODO: Call API to manually advance simulation tick
    setWorld((prev) => ({
      ...prev,
      tick: prev.tick + 1,
      updatedAt: new Date(),
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-neutral-900/80 border-b border-neutral-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-medium text-white">
                {world.config.name}
              </h1>
              <p className="text-sm text-neutral-500">
                Tick {world.tick} • {world.status}
              </p>
            </div>
          </div>
          <button
            onClick={handleAdvanceTick}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Advance Tick
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left panel - Feed/Citizens */}
        <div className="flex-1 flex flex-col border-r border-neutral-800">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "feed"
                  ? "text-divine-400 border-b-2 border-divine-500"
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
                  ? "text-divine-400 border-b-2 border-divine-500"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Citizens
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "feed" ? (
              <WorldFeed items={feedItems} isLoading={isLoading} />
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
        <div className="w-80 p-4 bg-neutral-950">
          <PresencePanel
            world={world}
            selectedCitizen={selectedCitizen}
            currentMode={presenceMode}
            onModeChange={setPresenceMode}
          />
        </div>
      </div>
    </div>
  );
}
