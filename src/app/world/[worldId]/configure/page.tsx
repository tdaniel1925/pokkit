"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface WorldConfig {
  populationSize: number;
  culturalEntropy: number;
  beliefPlasticity: number;
  crisisFrequency: number;
  authoritySkepticismIndex: number;
}

export default function ConfigurePage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  const { worldId } = use(params);
  const router = useRouter();
  const [worldName, setWorldName] = useState("");
  const [config, setConfig] = useState<WorldConfig>({
    populationSize: 25,
    culturalEntropy: 0.5,
    beliefPlasticity: 0.5,
    crisisFrequency: 0.3,
    authoritySkepticismIndex: 0.5,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing world data
  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch(`/api/world/${worldId}`);
        if (res.ok) {
          const data = await res.json();
          setWorldName(data.world.config?.name || "");
          if (data.world.config) {
            setConfig({
              populationSize: data.world.config.populationSize || 25,
              culturalEntropy: data.world.config.culturalEntropy || 0.5,
              beliefPlasticity: data.world.config.beliefPlasticity || 0.5,
              crisisFrequency: data.world.config.crisisFrequency || 0.3,
              authoritySkepticismIndex: data.world.config.authoritySkepticismIndex || 0.5,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load world:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorld();
  }, [worldId]);

  const handleCreateLife = async () => {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      // First update the config
      await fetch(`/api/world/${worldId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { ...config, name: worldName } }),
      });

      // Then create the citizens
      const res = await fetch(`/api/world/${worldId}/create-life`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create life");
      }

      // Navigate to the world view
      router.push(`/world/${worldId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light mb-4">Configure Your Creation</h1>
          <p className="text-white/60">
            These parameters will shape the nature of existence.
          </p>
        </div>

        {/* World Name */}
        <div className="mb-12">
          <label className="block text-sm text-white/60 mb-3">
            Name your world
          </label>
          <input
            type="text"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="Eden, Genesis, Nova..."
            className="w-full bg-transparent border-b border-white/30 focus:border-white px-0 py-3 text-2xl text-white placeholder:text-white/30 focus:outline-none transition-colors"
          />
        </div>

        {/* Configuration Sliders */}
        <div className="space-y-10">
          {/* Population */}
          <ConfigSlider
            label="Initial Population"
            value={config.populationSize}
            min={5}
            max={100}
            step={5}
            description="How many souls will you bring into being?"
            format={(v) => `${v} souls`}
            onChange={(v) => setConfig({ ...config, populationSize: v })}
          />

          {/* Cultural Entropy */}
          <ConfigSlider
            label="Cultural Diversity"
            value={config.culturalEntropy}
            min={0}
            max={1}
            step={0.1}
            description="Will they think alike, or will chaos reign?"
            format={(v) => (v < 0.3 ? "Unified" : v < 0.7 ? "Diverse" : "Chaotic")}
            onChange={(v) => setConfig({ ...config, culturalEntropy: v })}
          />

          {/* Belief Plasticity */}
          <ConfigSlider
            label="Belief Plasticity"
            value={config.beliefPlasticity}
            min={0}
            max={1}
            step={0.1}
            description="How easily will they change their minds?"
            format={(v) => (v < 0.3 ? "Rigid" : v < 0.7 ? "Flexible" : "Fluid")}
            onChange={(v) => setConfig({ ...config, beliefPlasticity: v })}
          />

          {/* Authority Skepticism */}
          <ConfigSlider
            label="Divine Skepticism"
            value={config.authoritySkepticismIndex}
            min={0}
            max={1}
            step={0.1}
            description="How much will they question your existence?"
            format={(v) => (v < 0.3 ? "Trusting" : v < 0.7 ? "Questioning" : "Skeptical")}
            onChange={(v) => setConfig({ ...config, authoritySkepticismIndex: v })}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Create Button */}
        <div className="mt-16 text-center">
          <button
            onClick={handleCreateLife}
            disabled={isCreating || !worldName.trim()}
            className="group relative px-12 py-4 text-xl font-light border border-white/50 hover:border-white hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Speaking life into being...
              </span>
            ) : (
              "Let there be light"
            )}
          </button>
          <p className="mt-4 text-white/40 text-sm">
            This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfigSlider({
  label,
  value,
  min,
  max,
  step,
  description,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-lg font-light">{label}</label>
        <span className="text-white/80">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
      <p className="text-white/40 text-sm mt-2">{description}</p>
    </div>
  );
}
