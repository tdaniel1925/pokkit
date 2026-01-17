"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye } from "lucide-react";

interface WorldData {
  world: {
    id: string;
    config: {
      name: string;
      populationSize: number;
    };
    tick: number;
  };
  citizens: Array<{
    id: string;
    name: string;
  }>;
  feedItems: Array<{
    id: string;
    content: string;
    type: string;
  }>;
}

export default function ObservePage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const router = useRouter();
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch(`/api/world/${worldId}`);
        if (res.ok) {
          const data = await res.json();
          setWorldData(data);
          // Delay showing content for dramatic effect
          setTimeout(() => setShowContent(true), 500);
        }
      } catch (err) {
        console.error("Failed to load world:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorld();
  }, [worldId]);

  const handleEnterWorld = () => {
    // Transition to world mode
    router.push(`/world/${worldId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#0a1f0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5f5f0] animate-spin" />
      </div>
    );
  }

  const citizenCount = worldData?.citizens?.length || 0;
  const worldName = worldData?.world?.config?.name || "Your World";

  return (
    <div className="h-screen overflow-hidden bg-[#0a1f0a] flex flex-col items-center justify-center p-8 select-none">
      <div
        className={`max-w-3xl text-center space-y-12 transition-all duration-1000 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Creation announcement */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-light text-[#f5f5f0] tracking-wide">
            It is done.
          </h1>

          <div className="h-px w-32 bg-[#f5f5f0]/30 mx-auto" />

          <p className="text-2xl md:text-3xl text-[#f5f5f0]/80 font-light leading-relaxed">
            {citizenCount} souls now exist in {worldName}.
          </p>
        </div>

        {/* First feed item - the creation event */}
        {worldData?.feedItems?.[0] && (
          <div className="bg-[#f5f5f0]/5 border border-[#f5f5f0]/10 rounded-lg p-6 text-left">
            <p className="text-[#f5f5f0]/70 text-lg italic leading-relaxed">
              "{worldData.feedItems[0].content}"
            </p>
          </div>
        )}

        {/* Description of what happens next */}
        <div className="space-y-4 text-[#f5f5f0]/60">
          <p className="text-lg">
            They are waking up. They are beginning to think.
          </p>
          <p className="text-lg">
            They do not yet know you exist.
          </p>
        </div>

        {/* Enter button */}
        <div className="pt-8">
          <button
            onClick={handleEnterWorld}
            className="group flex items-center gap-3 mx-auto px-10 py-4 bg-[#f5f5f0] text-[#0a1f0a] text-xl font-medium rounded-lg hover:bg-[#f5f5f0]/90 transition-all duration-300"
          >
            <Eye className="w-5 h-5" />
            Observe
          </button>
          <p className="mt-4 text-[#f5f5f0]/40 text-sm">
            Begin watching your world unfold
          </p>
        </div>
      </div>

      {/* Subtle particles or ambient effect could go here */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f5f5f0]/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#f5f5f0]/[0.02] rounded-full blur-3xl" />
      </div>
    </div>
  );
}
